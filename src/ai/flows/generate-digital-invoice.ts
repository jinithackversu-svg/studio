'use server';

/**
 * @fileOverview Generates a digital invoice with a scannable QR code for customer pickup validation.
 *
 * - generateDigitalInvoice - A function that generates the digital invoice.
 * - GenerateDigitalInvoiceInput - The input type for the generateDigitalInvoice function.
 * - GenerateDigitalInvoiceOutput - The return type for the generateDigitalInvoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDigitalInvoiceInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  orderId: z.string().describe('The unique identifier for the order.'),
  orderItems: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      quantity: z.number().describe('The quantity of the item.'),
      price: z.number().describe('The price of the item.'),
    })
  ).describe('The items in the order.'),
  totalAmount: z.number().describe('The total amount of the order.'),
  paymentMethod: z.string().describe('The payment method used for the order.'),
  qrCodeDataUri: z.string().describe(
    'A data URI containing the QR code image for pickup validation. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* As a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.*/
  ),
});
export type GenerateDigitalInvoiceInput = z.infer<typeof GenerateDigitalInvoiceInputSchema>;

const GenerateDigitalInvoiceOutputSchema = z.object({
  invoiceText: z.string().describe('The generated digital invoice text, which can be displayed to the customer.'),
});
export type GenerateDigitalInvoiceOutput = z.infer<typeof GenerateDigitalInvoiceOutputSchema>;

export async function generateDigitalInvoice(input: GenerateDigitalInvoiceInput): Promise<GenerateDigitalInvoiceOutput> {
  return generateDigitalInvoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDigitalInvoicePrompt',
  input: {schema: GenerateDigitalInvoiceInputSchema},
  output: {schema: GenerateDigitalInvoiceOutputSchema},
  prompt: `You are a digital invoice generator for CanteenConnect.
  Generate a concise and user-friendly digital invoice based on the following information:

  Customer Name: {{{customerName}}}
  Order ID: {{{orderId}}}
  Order Items:
  {{#each orderItems}}
  - {{{name}}} (Quantity: {{{quantity}}}, Price: {{{price}}})
  {{/each}}
  Total Amount: {{{totalAmount}}}
  Payment Method: {{{paymentMethod}}}

  Include a section indicating that the following QR code should be scanned for pickup validation.

  QR Code: {{media url=qrCodeDataUri}}

  Make sure the output is plain text, and does not include any HTML or other markup.
  `,
});

const generateDigitalInvoiceFlow = ai.defineFlow(
  {
    name: 'generateDigitalInvoiceFlow',
    inputSchema: GenerateDigitalInvoiceInputSchema,
    outputSchema: GenerateDigitalInvoiceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
