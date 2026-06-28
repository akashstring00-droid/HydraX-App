import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { UserProfile } from '../store/useAuthStore';
import { WaterLog } from '../store/useWaterStore';
import { DiarrheaLog } from '../store/useDiarrheaStore';

export interface ReportData {
  profile: UserProfile | null;
  waterLogs: WaterLog[];
  symptomLogs: DiarrheaLog[];
  avgHeartRate: number;
  avgHrv: number;
  avgSkinTemp: number;
  recoveryScore: number;
  startDate: string;
  endDate: string;
  reportType: 'Daily' | 'Weekly' | 'Monthly';
}

export class ReportsCompiler {
  static async compileAndShare(data: ReportData): Promise<void> {
    const totalWater = data.waterLogs.reduce((sum, log) => sum + log.amount, 0);
    const avgWater = data.waterLogs.length > 0 ? Math.round(totalWater / 7) : 0;
    const totalFluidLoss = data.symptomLogs.reduce((sum, log) => sum + log.fluidLossEstimate, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>HydraX Bio-Intelligence Dossier</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #050B18;
              color: #FFFFFF;
              padding: 40px;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid rgba(0, 229, 195, 0.2);
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .brand {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 3px;
              color: #00E5C3;
            }
            .title {
              font-size: 14px;
              color: #8E9AA6;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .card {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              padding: 20px;
            }
            .card h3 {
              margin-top: 0;
              color: #00E5C3;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .stat-value {
              font-size: 32px;
              font-weight: 800;
              color: #FFFFFF;
              margin: 10px 0;
            }
            .stat-unit {
              font-size: 14px;
              color: #8E9AA6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            th {
              color: #8E9AA6;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              font-size: 13px;
            }
            .severity-badge {
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
            }
            .severity-Mild { background: rgba(0, 229, 195, 0.1); color: #00E5C3; }
            .severity-Moderate { background: rgba(20, 184, 255, 0.1); color: #14B8FF; }
            .severity-Severe { background: rgba(255, 77, 109, 0.1); color: #FF4D6D; }
            .footer {
              margin-top: 60px;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              padding-top: 20px;
              font-size: 10px;
              color: #8E9AA6;
              text-align: center;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">HYDRAX</div>
              <div class="title">${data.reportType} METABOLIC DOSSIER</div>
            </div>
            <div style="text-align: right; color: #8E9AA6; font-size: 12px;">
              Period: ${data.startDate} - ${data.endDate}<br>
              Generated: ${new Date().toLocaleDateString()}
            </div>
          </div>

          <div class="meta-grid">
            <div class="card">
              <h3>Subject Profile</h3>
              <div style="font-size: 14px; line-height: 1.8;">
                <strong>Name:</strong> ${data.profile?.displayName || 'Akash Sharma'}<br>
                <strong>Age / Gender:</strong> ${data.profile?.age || 28} / ${data.profile?.gender || 'Male'}<br>
                <strong>Blood Type:</strong> ${data.profile?.bloodGroup || 'O+'}<br>
                <strong>Location:</strong> ${data.profile?.city || 'Bangalore'}, ${data.profile?.country || 'India'}
              </div>
            </div>

            <div class="card">
              <h3>Physiological Baselines</h3>
              <div style="font-size: 14px; line-height: 1.8;">
                <strong>Avg Heart Rate:</strong> ${data.avgHeartRate} BPM<br>
                <strong>Avg HRV:</strong> ${data.avgHrv} ms<br>
                <strong>Skin Temperature:</strong> ${data.avgSkinTemp} &deg;C<br>
                <strong>Bowel Recovery Index:</strong> ${data.recoveryScore}%
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="card">
              <h3>Total Fluid Consumed</h3>
              <div class="stat-value">${totalWater} <span class="stat-unit">ml</span></div>
              <div style="font-size: 12px; color: #8E9AA6;">Average: ${avgWater} ml / day</div>
            </div>

            <div class="card">
              <h3>Bowel Fluid Loss</h3>
              <div class="stat-value" style="color: #FF4D6D;">${totalFluidLoss} <span class="stat-unit">ml</span></div>
              <div style="font-size: 12px; color: #8E9AA6;">Total estimated digestive fluid discharge</div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 30px;">
            <h3>Intake Activity Log</h3>
            ${data.waterLogs.length === 0 ? '<p style="font-size:12px; color:#8E9AA6;">No water logged in this period.</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Volume (ml)</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.waterLogs.map(log => `
                    <tr>
                      <td>${new Date(log.timestamp).toLocaleString()}</td>
                      <td><strong>${log.amount} ml</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <div class="card">
            <h3>Symptom & Digest Log</h3>
            ${data.symptomLogs.length === 0 ? '<p style="font-size:12px; color:#8E9AA6;">No bowel disturbances recorded.</p>' : `
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Bristol Stool Type</th>
                    <th>Frequency</th>
                    <th>Cramping</th>
                    <th>Fever</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.symptomLogs.map(log => `
                    <tr>
                      <td>${new Date(log.timestamp).toLocaleString()}</td>
                      <td>Type ${log.stoolType}</td>
                      <td>${log.frequency}x</td>
                      <td>${log.cramping}</td>
                      <td>${log.fever ? 'Yes' : 'No'}</td>
                      <td><span class="severity-badge severity-${log.severity}">${log.severity}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <div class="footer">
            <strong>HIPAA CONFIDENTIAL DISCLOSURE</strong><br>
            HydraX is a bio-intelligence evaluation tracker. All calculations are metabolic estimations and do not constitute formal diagnostic advice.
          </div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'HydraX Metabolic Dossier',
          UTI: 'com.adobe.pdf'
        });
      }
    } catch (err) {
      console.error('Failed to compile report PDF:', err);
      throw err;
    }
  }
}
