import React from 'react';
import { Invoice } from '../types';
import { Building2, MapPin, Mail, User } from 'lucide-react';

interface InvoiceTemplateProps {
  invoice: Invoice;
  id?: string;
}

export function formatIndianCurrency(amount: number): string {
  try {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `₹ ${formattedNumber}`;
  } catch (e) {
    return `₹ ${(amount || 0).toFixed(2)}`;
  }
}

/**
 * Convert number into words in Indian Numbering format (Lakhs, Crores)
 */
export function numberToWordsINR(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + a[n % 10];
      }
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = inWords(integerPart).replace(/\s+/g, ' ').trim();
  if (!result) result = 'Zero';
  result += ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart).replace(/\s+/g, ' ').trim() + ' Paise';
  }
  return result + ' Only';
}

/**
 * Dual-swirl circular logo from reference image (orange & charcoal)
 */
export const BhadaniLogo: React.FC<{ size?: number }> = ({ size = 52 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <g transform="translate(50,50)">
      {/* Orange left-to-top swirl */}
      <path
        d="M -7 -44 C 18 -44 38 -28 35 -6 C 32 14 16 22 2 30 C -12 38 -20 44 -14 48 C -8 52 10 46 16 38 C 12 45 0 49 -10 48 C -32 46 -46 26 -44 0 C -42 -26 -28 -44 -7 -44 Z"
        fill="#cf5624"
      />
      {/* Black right-to-bottom swirl */}
      <path
        d="M 7 44 C -18 44 -38 28 -35 6 C -32 -14 -16 -22 -2 -30 C 12 -38 20 -44 14 -48 C 8 -52 -10 -46 -16 -38 C -12 -45 0 -49 10 -48 C 32 -46 46 -26 44 0 C 42 26 28 44 7 44 Z"
        fill="#222222"
      />
    </g>
  </svg>
);

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, id = 'invoice-render-target' }, ref) => {
    const contactPhone = invoice.companyPhone || '9431163109';
    const contactEmail = invoice.companyEmail || 'dineshbhadani05@gmail.com';
    const contactPerson = invoice.contactPersonInfo || 'DR D. P. BHADANI +91-9431163109';
    const footerMsg = invoice.footerMessage || 'THANK YOU FOR YOUR BUSINESS!';

    return (
      <div
        id={id}
        ref={ref}
        className="relative w-full max-w-[794px] mx-auto bg-white text-zinc-900 font-sans shadow-md border-2 border-indigo-400 print:border-none print:shadow-none overflow-hidden select-none"
        style={{
          width: '794px',
          minHeight: '1122px',
          boxSizing: 'border-box',
          position: 'relative',
          backgroundColor: '#ffffff'
        }}
      >
        {/* ================= TOP GEOMETRIC BANNERS ================= */}
        <div className="absolute top-0 left-0 w-full h-[85px] pointer-events-none z-0">
          <svg
            width="794"
            height="85"
            viewBox="0 0 794 85"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Top orange strip above black polygon */}
            <polygon points="0,0 580,0 565,8 0,8" fill="#cf5624" />
            {/* Left large dark charcoal polygon */}
            <polygon points="0,8 565,8 495,72 0,72" fill="#222222" />
            {/* Top right orange stripe */}
            <polygon points="590,8 794,8 794,18 600,18" fill="#cf5624" />
            {/* Top right black stripe */}
            <polygon points="560,28 794,28 794,38 570,38" fill="#222222" />
          </svg>
        </div>

        {/* ================= BOTTOM GEOMETRIC BANNERS ================= */}
        <div className="absolute bottom-0 left-0 w-full h-[100px] pointer-events-none z-0">
          <svg
            width="794"
            height="100"
            viewBox="0 0 794 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Bottom-left black bar */}
            <polygon points="0,65 240,65 205,100 0,100" fill="#222222" />
            {/* Bottom-left thin orange strip */}
            <polygon points="0,58 248,58 240,65 0,65" fill="#cf5624" />
            {/* Bottom-right large orange polygon */}
            <polygon points="260,100 375,30 794,30 794,100" fill="#cf5624" />
          </svg>
        </div>

        {/* ================= WATERMARK LAYER ================= */}
        <div
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0"
          aria-hidden="true"
        >
          <div
            style={{
              transform: 'rotate(-32deg)',
              transformOrigin: 'center',
              fontSize: '68px',
              fontWeight: 900,
              letterSpacing: '0.22em',
              color: 'rgba(0, 0, 0, 0.04)',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            BHADANI COMPLEX
          </div>
        </div>

        {/* ================= MAIN CONTENT LAYER ================= */}
        <div className="relative z-10 px-12 pt-24 pb-20 flex flex-col justify-between" style={{ minHeight: '1122px' }}>
          
          <div>
            {/* Header: Logo + Company Info + INVOICE # */}
            <div className="flex justify-between items-start mb-6">
              
              {/* Left: Logo & Address */}
              <div className="flex items-center gap-3.5">
                <BhadaniLogo size={54} />
                <div className="text-left leading-tight">
                  <div className="font-extrabold text-[15px] text-zinc-900 uppercase tracking-wide">
                    {invoice.companyName || 'BHADANI COMPLEX'}
                  </div>
                  <div className="font-bold text-[12px] text-zinc-800 uppercase tracking-wide mt-0.5">
                    SATYAM &nbsp; &nbsp; &nbsp; &nbsp; NAGAR,
                  </div>
                  <div className="font-bold text-[12px] text-zinc-800 uppercase tracking-wide">
                    DHANBAD, 826001
                  </div>
                </div>
              </div>

              {/* Right: INVOICE # */}
              <div className="text-right pt-2">
                <span className="font-bold text-[15px] text-zinc-900 uppercase tracking-wide">
                  INVOICE # {invoice.invoiceNumber}
                </span>
              </div>
            </div>

            {/* Giant Title: INVOICE */}
            <div className="mb-6 mt-4">
              <h1 className="text-[52px] font-black text-zinc-900 tracking-tight leading-none">
                INVOICE
              </h1>
            </div>

            {/* Date line */}
            <div className="mb-7 text-[14px] text-zinc-900">
              <span className="font-medium">Date : &nbsp; &nbsp;</span>
              <span className="font-bold">{invoice.date}</span>
            </div>

            {/* Billed To & From Two Column Layout */}
            <div className="grid grid-cols-2 gap-10 mb-8 text-[13px]">
              
              {/* Billed To */}
              <div>
                <div className="font-bold text-zinc-900 mb-2">
                  Billed To :
                </div>
                <div className="space-y-1 text-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900">
                    <Building2 className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                    <span>{invoice.customerName}</span>
                  </div>
                  {invoice.customerAddress && (
                    <div className="flex items-start gap-2 text-zinc-700">
                      <MapPin className="w-3.5 h-3.5 text-zinc-800 shrink-0 mt-0.5" />
                      <span className="leading-snug">{invoice.customerAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* From */}
              <div>
                <div className="font-bold text-zinc-900 mb-2">
                  From :
                </div>
                <div className="space-y-1 text-zinc-800">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900">
                    <User className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                    <span>Dr D. P. Bhadani</span>
                  </div>
                  <div className="flex items-start gap-2 text-zinc-700">
                    <MapPin className="w-3.5 h-3.5 text-zinc-800 shrink-0 mt-0.5" />
                    <span>{invoice.companyAddress || 'Satyam Nagar, Dhanbad, 826001'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Mail className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                    <span>{contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-6">
              {/* Header Bar: Light Gray */}
              <div className="bg-[#e5e7eb] px-4 py-2.5 flex justify-between items-center text-[12px] font-bold text-zinc-900 tracking-wider">
                <span>ITEM DESCRIPTION</span>
                <span>AMOUNT</span>
              </div>

              {/* Items Rows */}
              <div className="px-4 divide-y divide-zinc-100">
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="py-2.5 flex justify-between items-center text-[13px]"
                  >
                    <span className="text-zinc-900 font-medium">
                      {item.description}
                    </span>
                    <span className="text-zinc-900 font-semibold font-mono whitespace-nowrap">
                      {formatIndianCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider under items */}
              <div className="w-full h-px bg-zinc-200 mt-2" />
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-1 text-[13px]">
                <div className="flex justify-between items-center text-zinc-800">
                  <span className="font-normal">Subtotal</span>
                  <span className="font-semibold font-mono">{formatIndianCurrency(invoice.subtotal)}</span>
                </div>

                {invoice.taxRate ? (
                  <div className="flex justify-between items-center text-zinc-800">
                    <span className="font-normal">Tax Rate</span>
                    <span className="font-semibold font-mono">{invoice.taxRate}</span>
                  </div>
                ) : null}

                {invoice.additionalCosts ? (
                  <div className="flex justify-between items-center text-zinc-800">
                    <span className="font-normal">Additional Costs</span>
                    <span className="font-semibold font-mono">{formatIndianCurrency(invoice.additionalCosts)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between items-center pt-1.5 text-zinc-900 font-bold border-t border-zinc-200">
                  <span>TOTAL COST</span>
                  <span className="text-[14px] font-bold font-mono">
                    {formatIndianCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Purpose in bold terracotta/orange */}
            {invoice.forPurpose && (
              <div className="mb-6 text-[14px] font-bold text-[#cf5624]">
                Purpose : {invoice.forPurpose}
              </div>
            )}
          </div>

          {/* ================= FOOTER DETAILS ================= */}
          <div className="pt-4">
            <div className="grid grid-cols-2 gap-8 text-[12px] leading-tight">
              {/* Left Column: Phone, Email, Thank you */}
              <div className="space-y-1 text-zinc-800 font-semibold">
                <div>
                  <span className="font-normal">Phone &nbsp; &nbsp; &nbsp; &nbsp;: &nbsp;</span>
                  <span>{contactPhone}</span>
                </div>
                <div>
                  <span className="font-normal">Email &nbsp; &nbsp; &nbsp; &nbsp; : &nbsp;</span>
                  <span>{contactEmail}</span>
                </div>
                <div className="pt-2 font-black text-zinc-900 tracking-wide uppercase">
                  {footerMsg}
                </div>
              </div>

              {/* Right Column: Contact note */}
              <div className="text-[11px] text-zinc-800 font-bold leading-normal uppercase">
                IF YOU HAVE ANY QUESTIONS CONCERNING THIS INVOICE, CONTACT: {contactPerson}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
