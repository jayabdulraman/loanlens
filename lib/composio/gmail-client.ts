import { Composio } from "@composio/core"
import { OpenAI } from "openai"

export interface LoanApprovalDetails {
  loanId: string
  loanAmount: number
  interestRate: number
  loanTerm?: number
  monthlyPayment: number
  propertyAddress?: string
  ltv?: number
  dti?: number
  creditScore?: number
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

// let toolset: ComposioToolSet | null = null

// env: OPENAI_API_KEY
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// env: COMPOSIO_API_KEY
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
});

async function getComposio() {
  if (!process.env.COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is not set")
  }
    try {

        // Get server URLs for a specific user
        // const serverDetails = await composio.mcp.getByName("loanlens-gmail-n3ikj0");
        // console.log("Server details:", serverDetails);
      
      const userEmail = process.env.GMAIL_USER_EMAIL || "infogrow99@gmail.com"
      const AUTH_KEY = process.env.GMAIL_AUTH_KEY || "ac_EnDVyucFIIlD"
      const connectedAccount = await composio.connectedAccounts.get("ca_VYRbOnfLPnef");
      console.log("Connected account:", connectedAccount.status);
      if (connectedAccount?.status !== "ACTIVE") {
        const connectionRequest = await composio.connectedAccounts.initiate(userEmail, AUTH_KEY);
        await connectionRequest.waitForConnection(60000);
        console.log("Connection established successfully!");
      }

      // redirect the user to the OAuth flow
    //   const redirectUrl = connectionRequest.redirectUrl;
    //   console.log("Redirect URL:", redirectUrl);

      // wait for connection to be established
      // await connectionRequest.waitForConnection(60000);
      // console.log("Connection established successfully!");
      return composio
    } catch (error) {
      console.log("Error initializing ComposioToolSet:", JSON.stringify(error, null, 2))
      throw error
    }
}

export async function sendLoanApprovalEmail(
  recipientEmail: string,
  borrowerName: string,
  loanDetails: LoanApprovalDetails
): Promise<EmailSendResult> {
  
  const composio = await getComposio()
  const html = generateApprovalEmailTemplate(borrowerName, loanDetails)
  const userId = process.env.USER_ID || "ca_VYRbOnfLPnef"
  const userEmail = process.env.GMAIL_USER_EMAIL || "infogrow99@gmail.com"
  console.log("Email Template:", html)
  try {
    console.log("Processing before tools");
    const toolsForResponses = await composio.tools.get(userId, {
        tools: ["GMAIL_SEND_EMAIL"],
    });
    console.log("Processing after tools");
    const task = `Send an email to ${recipientEmail} with the subject '🎉 Great News! Your Loan Application Has Been Approved' and the body ${html}`;
    //Define the messages for the assistant
    const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
        role: "system",
        content: "You are a helpful assistant that can help with tasks.",
        },
        { role: "user", content: task },
    ];
  
    // Create a chat completion
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: toolsForResponses,
        tool_choice: "auto",
    });
    console.log("Processing after response");
    // Execute the tool calls 
    // @ts-expect-error composio provider types may not match openai output locally
    const result = await composio.provider.handleToolCalls(userEmail, response);
    console.log(result);
    // Will return the raw response from the GMAIL_SEND_EMAIL API.
    console.log("Email sent successfully!");
    const resp = result as { successful?: boolean; data?: { id?: string }; error?: string }
    if (resp?.successful === false) return { success: false, error: resp.error || "Failed to send approval email" }
    return { success: true, messageId: resp?.data?.id }
  } catch (error) {
    console.log("Error sending approval email:", JSON.stringify(error, null, 2))
    const err = error as { message?: string }
    return { success: false, error: err?.message ?? "Failed to send approval email" }
  }
}

export async function sendConditionalApprovalEmail(
  recipientEmail: string,
  borrowerName: string,
  conditions: string[]
): Promise<EmailSendResult> {
  const html = generateConditionalEmailTemplate(borrowerName, conditions)
  const userId = process.env.USER_ID || "ca_VYRbOnfLPnef"
  const userEmail = process.env.GMAIL_USER_EMAIL || "infogrow99@gmail.com"
  try {
    const composio = await getComposio()
    const toolsForResponses = await composio.tools.get(userId, {
        tools: ["GMAIL_SEND_EMAIL"],
    });
    const task = `Send an email to ${recipientEmail} with the subject '📋 Your Loan Application Status Update - Action Required' and the body ${html}`;
    const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
        role: "system",
        content: "You are a helpful assistant that can help with tasks.",
        },
        { role: "user", content: task },
    ];
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: toolsForResponses,
        tool_choice: "auto",
    });
    // @ts-expect-error composio provider types may not match openai output locally
    const result = await composio.provider.handleToolCalls(userEmail, response);
    console.log(result);
    // Will return the raw response from the GMAIL_SEND_EMAIL API.
    console.log("Email sent successfully!");
    const resp = result as { successful?: boolean; data?: { id?: string }; error?: string }
    if (resp?.successful === false) return { success: false, error: resp.error || "Failed to send conditional email" }
    return { success: true, messageId: resp?.data?.id }
  } catch (error) {
    const err = error as { message?: string }
    return { success: false, error: err?.message ?? "Failed to send conditional email" }
  }
}

function generateApprovalEmailTemplate(borrowerName: string, loanDetails: LoanApprovalDetails) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loan Approval Notification</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
    .highlight { background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
    .loan-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .btn { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Congratulations ${borrowerName}!</h1>
        <h2>Your Loan Application Has Been Approved</h2>
      </div>
      <div class="content">
        <div class="highlight">
          <strong>Great news!</strong> Your mortgage application has been approved and you're one step closer to owning your new home.
        </div>
        <div class="loan-details">
          <h3>📋 Loan Details</h3>
          <div class="detail-row"><span><strong>Loan Amount:</strong></span><span>${loanDetails.loanAmount.toLocaleString?.() ?? loanDetails.loanAmount}</span></div>
          <div class="detail-row"><span><strong>Interest Rate:</strong></span><span>${loanDetails.interestRate}%</span></div>
          ${loanDetails.loanTerm ? `<div class="detail-row"><span><strong>Loan Term:</strong></span><span>${loanDetails.loanTerm} years</span></div>` : ''}
          <div class="detail-row"><span><strong>Monthly Payment:</strong></span><span>${loanDetails.monthlyPayment.toLocaleString?.() ?? loanDetails.monthlyPayment}</span></div>
          ${loanDetails.propertyAddress ? `<div class="detail-row"><span><strong>Property Address:</strong></span><span>${loanDetails.propertyAddress}</span></div>` : ''}
        </div>
        <a href="${appUrl ? `${appUrl}/dashboard/loan/${loanDetails.loanId}` : '#'}" class="btn color-white">View Full Loan Details</a>
      </div>
      <div class="footer">© ${new Date().getFullYear()} LoanLens AI. All rights reserved.</div>
    </div>
  </body>
</html>`
}

function generateConditionalEmailTemplate(borrowerName: string, conditions: string[]) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conditional Loan Approval</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
    .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .conditions { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .condition-item { background: white; padding: 15px; margin: 10px 0; border-left: 3px solid #ffc107; border-radius: 4px; }
    .btn { background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📋 Conditional Approval</h1>
        <h2>Action Required on Your Loan Application</h2>
      </div>
      <div class="content">
        <div class="highlight">
          <strong>Good news!</strong> Your loan application has been conditionally approved. Please review the conditions below to complete your approval.
        </div>
        <div class="conditions">
          <h3>📋 Required Actions</h3>
          ${conditions
            .map((condition, index) => `<div class="condition-item"><strong>${index + 1}.</strong> ${condition}</div>`)
            .join("")}
        </div>
        <a href="${appUrl ? `${appUrl}/dashboard/conditions` : '#'}" class="btn">Upload Required Documents</a>
      </div>
      <div class="footer">© ${new Date().getFullYear()} Addy AI. All rights reserved.</div>
    </div>
  </body>
</html>`
}


