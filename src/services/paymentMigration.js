/**
 * Payment Migration & Repair Service
 * Fixes corrupted payment records in Firestore
 * Particularly: payments with amount = 0 on paid status
 * 
 * USAGE: Call from admin panel or maintenance scripts
 * NOT for production until thoroughly tested
 */

import { db } from '../config/firebase.config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

/**
 * Repair broken payment records
 * Finds payments with amount=0 but status=paid and attempts to fix them
 * using linked session data
 * 
 * @returns {Promise<Object>} Migration report
 */
export const repairBrokenPayments = async (options = {}) => {
  const {
    dryRun = true,           // Just report, don't actually update
    limitReports = 100,      // Max number to process
    fixZeroAmounts = true,   // Fix payments with 0 amount
    fixMissingSessions = true, // Fix missing sessionId
  } = options;

  const report = {
    timestamp: new Date(),
    dryRun,
    paymentsProcessed: 0,
    paymentsFixed: 0,
    paymentsFailed: 0,
    issues: [],
    fixedPayments: [],
    failedPayments: [],
  };

  try {
    console.log('🔧 [MIGRATION] Starting payment repair process...', { dryRun });

    // Find broken payments: status=paid but amount=0
    const brokenPaymentsQuery = query(
      collection(db, 'payments'),
      where('status', '==', 'paid'),
      where('amount', '==', 0)
    );

    const brokenSnapshot = await getDocs(brokenPaymentsQuery);
    console.log(`📊 [MIGRATION] Found ${brokenSnapshot.size} payments with zero amount on paid status`);

    const batch = writeBatch(db);
    let updateCount = 0;

    for (const paymentDoc of brokenSnapshot.docs) {
      if (updateCount >= limitReports) {
        console.log(`⚠️  [MIGRATION] Reached limit of ${limitReports} payments. Stopping.`);
        break;
      }

      const payment = paymentDoc.data();
      const paymentId = paymentDoc.id;
      report.paymentsProcessed++;

      console.log(`\n🔍 [MIGRATION] Processing payment: ${paymentId}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${payment.amount} OMR`);
      console.log(`   SessionId: ${payment.sessionId ? '✓' : '✗ MISSING'}`);
      console.log(`   gateway Amount: ${payment.gatewayAmount || '✗ MISSING'}`);

      const issues = [];
      const fixes = {};

      // Issue 1: Zero amount
      if (fixZeroAmounts && payment.amount === 0) {
        issues.push('Zero amount on paid payment');

        // Try to get amount from session
        if (payment.sessionId) {
          try {
            const sessionDoc = await getSessionFromId(payment.sessionId);
            if (sessionDoc.exists()) {
              const sessionData = sessionDoc.data();
              const sesAmount = sessionData.amount; // in baisa
              if (sesAmount && sesAmount > 0) {
                const newAmount = sesAmount / 1000; // Convert to OMR
                fixes.amount = newAmount;
                fixes.gatewayAmount = sesAmount;
                console.log(`   ✓ Can fix: ${newAmount.toFixed(3)} OMR from session`);
              } else {
                console.log(`   ✗ Cannot fix: session amount invalid (${sesAmount})`);
              }
            } else {
              console.log(`   ✗ Cannot fix: session not found`);
            }
          } catch (err) {
            console.error(`   ✗ Error fetching session:`, err.message);
          }
        } else {
          // Try gatewayAmount instead
          if (payment.gatewayAmount && payment.gatewayAmount > 0) {
            const newAmount = payment.gatewayAmount / 1000;
            fixes.amount = newAmount;
            console.log(`   ✓ Can fix: ${newAmount.toFixed(3)} OMR from gatewayAmount`);
          } else {
            issues.push('Cannot recover amount: no session or gatewayAmount');
            console.log(`   ✗ Cannot fix: no gateway amount available`);
          }
        }
      }

      // Issue 2: Missing sessionId
      if (fixMissingSessions && !payment.sessionId) {
        issues.push('Missing sessionId');
        console.log(`   ✗ SessionId missing - cannot link to Thawani`);
        // Note: We can't recover sessionId since it's from Thawani response
      }

      // Log issues
      if (issues.length > 0) {
        report.issues.push({
          paymentId,
          issues,
          fixes: fixes,
        });
      }

      // Apply fixes if available
      if (Object.keys(fixes).length > 0) {
        console.log(`   💾 Fixes to apply:`, fixes);

        if (!dryRun) {
          try {
            const updatePayload = {
              ...fixes,
              migratedAt: Timestamp.now(),
              migrationNotes: `Auto-repaired zero amount. Fixed fields: ${Object.keys(fixes).join(', ')}`,
            };

            batch.update(doc(db, 'payments', paymentId), updatePayload);
            updateCount++;

            report.fixedPayments.push({
              paymentId,
              fixes,
            });

            console.log(`   ✅ Queued for update`);
            report.paymentsFixed++;
          } catch (err) {
            console.error(`   ❌ Error queuing update:`, err.message);
            report.failedPayments.push({
              paymentId,
              error: err.message,
            });
            report.paymentsFailed++;
          }
        } else {
          console.log(`   [DRY RUN] Would update with:`, fixes);
          report.paymentsFixed++;
        }
      } else {
        console.log(`   ℹ️  No fixes available for this payment`);
      }
    }

    // Commit batch updates
    if (!dryRun && updateCount > 0) {
      console.log(`\n💾 [MIGRATION] Committing ${updateCount} updates...`);
      try {
        await batch.commit();
        console.log(`✅ [MIGRATION] Committed ${updateCount} updates`);
      } catch (err) {
        console.error(`❌ [MIGRATION] Error committing batch:`, err);
        report.failedPayments.push({
          batchCommit: true,
          error: err.message,
        });
      }
    } else if (dryRun) {
      console.log(`\n🔍 [MIGRATION] DRY RUN: No updates committed`);
    }

    console.log(`\n📊 [MIGRATION] Report:`, {
      processed: report.paymentsProcessed,
      fixed: report.paymentsFixed,
      failed: report.paymentsFailed,
      dryRun: report.dryRun,
    });

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error('❌ [MIGRATION] Error during migration:', error);
    return {
      success: false,
      error: error.message,
      report,
    };
  }
};

/**
 * Get payment session by sessionId
 * @private
 */
async function getSessionFromId(sessionId) {
  return await getDocs(
    query(
      collection(db, 'paymentSessions'),
      where('sessionId', '==', sessionId)
    )
  ).then(snapshot => {
    if (snapshot.empty) {
      return { exists: () => false };
    }
    return {
      exists: () => true,
      data: () => snapshot.docs[0].data(),
    };
  });
}

/**
 * Validate all payments for data integrity issues
 * Reports all anomalies without fixing
 * 
 * @returns {Promise<Object>} Validation report
 */
export const validateAllPayments = async (options = {}) => {
  const { limitResults = 1000 } = options;

  const report = {
    timestamp: new Date(),
    totalPayments: 0,
    paymentsByStatus: {},
    anomalies: {
      zeroAmountPaid: [],
      missingSessionId: [],
      missingTransactionId: [],
      amountMismatch: [],
      missingGatewayResponse: [],
      other: [],
    },
  };

  try {
    console.log('🔍 [VALIDATION] Starting payment validation...');

    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(query(paymentsRef));

    console.log(`📊 [VALIDATION] Found ${snapshot.size} total payments`);

    let processed = 0;
    for (const doc of snapshot.docs) {
      if (processed >= limitResults) break;

      const payment = doc.data();
      const paymentId = doc.id;
      processed++;

      // Track by status
      const status = payment.status || 'unknown';
      report.paymentsByStatus[status] = (report.paymentsByStatus[status] || 0) + 1;

      // Check for anomalies
      if (payment.status === 'paid' && payment.amount === 0) {
        report.anomalies.zeroAmountPaid.push({
          paymentId,
          status: payment.status,
          amount: payment.amount,
        });
      }

      if (payment.paymentGateway === 'thawani' && !payment.sessionId) {
        report.anomalies.missingSessionId.push({
          paymentId,
          gateway: payment.paymentGateway,
        });
      }

      if (payment.paymentGateway === 'thawani' && !payment.transactionId) {
        report.anomalies.missingTransactionId.push({
          paymentId,
          gateway: payment.paymentGateway,
        });
      }

      if (payment.gatewayAmount && payment.amount) {
        const calc = payment.gatewayAmount / 1000;
        if (Math.abs(calc - payment.amount) > 0.01) {
          report.anomalies.amountMismatch.push({
            paymentId,
            amount: payment.amount,
            gatewayAmount: payment.gatewayAmount,
            discrepancy: (payment.amount - calc).toFixed(3),
          });
        }
      }

      if (payment.status === 'paid' && (!payment.gatewayResponse || Object.keys(payment.gatewayResponse).length === 0)) {
        report.anomalies.missingGatewayResponse.push({
          paymentId,
          status: payment.status,
        });
      }
    }

    report.totalPayments = processed;

    // Summary
    const totalAnomalies = Object.values(report.anomalies).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n✅ [VALIDATION] Complete:`, {
      totalPayments: processed,
      status: report.paymentsByStatus,
      totalAnomalies,
    });

    console.log(`📋 [VALIDATION] Anomaly Summary:`, {
      zeroAmountPaid: report.anomalies.zeroAmountPaid.length,
      missingSessionId: report.anomalies.missingSessionId.length,
      missingTransactionId: report.anomalies.missingTransactionId.length,
      amountMismatch: report.anomalies.amountMismatch.length,
      missingGatewayResponse: report.anomalies.missingGatewayResponse.length,
    });

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error('❌ [VALIDATION] Error during validation:', error);
    return {
      success: false,
      error: error.message,
      report,
    };
  }
};

/**
 * Generate migration script for database admin
 * Can be run from Firebase Console or admin backend
 */
export const generateMigrationScript = () => {
  return `
// Firebase Admin Script - Run in Cloud Functions or Firebase Console
const admin = require('firebase-admin');
const db = admin.firestore();

async function fixBrokenPayments() {
  const payments = await db.collection('payments')
    .where('status', '==', 'paid')
    .where('amount', '==', 0)
    .get();

  console.log('Found', payments.size, 'broken payments');

  const batch = db.batch();
  let count = 0;

  for (const paymentDoc of payments.docs) {
    const payment = paymentDoc.data();
    
    // Try to recover amount from session
    if (payment.sessionId && payment.sessionId.length > 0) {
      const sessionDoc = await db.collection('paymentSessions')
        .doc(payment.sessionId)
        .get();
      
      if (sessionDoc.exists) {
        const session = sessionDoc.data();
        if (session.amount > 0) {
          const newAmount = session.amount / 1000; // baisa to OMR
          batch.update(paymentDoc.ref, {
            amount: newAmount,
            gatewayAmount: session.amount,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationNotes: 'Recovered amount from paymentSessions',
          });
          count++;
          console.log('Fixed payment', paymentDoc.id, ':', newAmount, 'OMR');
        }
      }
    }
    // Fallback: try gatewayAmount
    else if (payment.gatewayAmount > 0) {
      const newAmount = payment.gatewayAmount / 1000;
      batch.update(paymentDoc.ref, {
        amount: newAmount,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        migrationNotes: 'Recovered amount from gatewayAmount',
      });
      count++;
      console.log('Fixed payment', paymentDoc.id, 'from gateway:', newAmount, 'OMR');
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log('✅ Fixed', count, 'payments');
  }
}

fixBrokenPayments().catch(console.error);
  `;
};
