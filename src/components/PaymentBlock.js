export default function PaymentBlock({ config = {}, userRole }) {
  if (userRole === 'admin') return <AdminBlockView config={config} />;
  return <GenericBlockView />;
}

function GenericBlockView() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '60px 20px 40px' }}>
        {/* Status badge */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#d13212', background: '#fef2f0', border: '1px solid #f5c6c2', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Suspended
          </span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.3 }}>
          सेवा निलंबित
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 32px', lineHeight: 1.6 }}>
          इस एप्लिकेशन की सेवा अस्थायी रूप से बंद कर दी गई है।<br />
          कृपया अधिक जानकारी के लिए संपर्क करें।
        </p>

        {/* Info card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ color: '#1a1a1a', fontWeight: 600 }}>Application</span>
            <span style={{ float: 'right' }}>Lucy Garden</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <span style={{ color: '#1a1a1a', fontWeight: 600 }}>Status</span>
            <span style={{ float: 'right', color: '#d13212', fontWeight: 600 }}>Service Suspended</span>
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px' }}>संपर्क करें</p>
          <a href="tel:+919939079107" style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'block' }}>
            +91 99390 79107
          </a>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Business Administrator</p>
        </div>

        <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '40px', textAlign: 'center' }}>Lucy Garden</p>
      </div>
    </div>
  );
}

function AdminBlockView({ config }) {
  const {
    title = 'Service Suspended',
    message = 'बकाया भुगतान के कारण आपकी सेवा बंद कर दी गई है।',
    contact = { name: 'Makeward', phone: '8051725780' },
    invoice = {},
    upi = {},
    showPayment = true,
  } = config;

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '40px 20px 32px' }}>
        {/* Status badge */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: '#d13212', background: '#fef2f0', border: '1px solid #f5c6c2', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Payment Required
          </span>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{title}</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>

        {/* Amount card */}
        {showPayment && invoice.number && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
            {/* Amount header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' }}>Amount Due</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>₹{invoice.due?.toLocaleString('en-IN')}</p>
            </div>
            {/* Details */}
            <div style={{ padding: '12px 16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Invoice</span>
                <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{invoice.number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Project</span>
                <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{invoice.project}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Total</span>
                <span style={{ color: '#1a1a1a', fontWeight: 500 }}>₹{invoice.total?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#6b7280' }}>Paid</span>
                <span style={{ color: '#16a34a', fontWeight: 500 }}>– ₹{invoice.paid?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment methods */}
        {showPayment && upi.id && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.3px' }}>Payment Details</p>
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>UPI</span>
                <span style={{ color: '#1a1a1a', fontWeight: 600, fontFamily: 'monospace' }}>{upi.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Name</span>
                <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{upi.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>Account</span>
                <span style={{ color: '#1a1a1a', fontWeight: 600, fontFamily: 'monospace' }}>{upi.account}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ color: '#6b7280' }}>IFSC</span>
                <span style={{ color: '#1a1a1a', fontWeight: 600, fontFamily: 'monospace' }}>{upi.ifsc}</span>
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px' }}>Developer</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{contact.name}</p>
          </div>
          <a href={`tel:+91${contact.phone}`} style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
            Call →
          </a>
        </div>

        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '20px', textAlign: 'center' }}>
          भुगतान के बाद 1 घंटे में सेवा बहाल हो जाएगी
        </p>
      </div>
    </div>
  );
}
