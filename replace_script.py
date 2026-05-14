
import sys

new_form_content = """
                <div className="space-y-6 mt-6">
                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: "upi", icon: "??", label: "UPI" },
                      { id: "card", icon: "??", label: "Card" },
                      { id: "netbanking", icon: "??", label: "Net Banking" },
                      { id: "wallet", icon: "??", label: "Wallet" }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === method.id 
                            ? "border-blue-600 bg-blue-50 text-blue-700" 
                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span className="text-xs font-semibold">{method.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                      <input 
                        required
                        type="text"
                        placeholder="Enter your full name"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                      <input 
                        required
                        type="email"
                        placeholder="email@example.com"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Phone Number</label>
                      <input 
                        required
                        type="tel"
                        placeholder="+91 00000 00000"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {/* Method Specific Fields */}
                  <div className="pt-4 border-t border-slate-100">
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase">Card Number</label>
                          <input required type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 rounded-lg border border-slate-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Expiry</label><input required type="text" placeholder="MM/YY" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">CVV</label><input required type="password" placeholder="***" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Billing Address</label><input required type="text" placeholder="Enter address" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                      </div>
                    )}

                    {paymentMethod === "upi" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">UPI ID</label>
                        <input required type="text" placeholder="username@okaxis" className="w-full p-3 rounded-lg border border-slate-200" />
                      </div>
                    )}

                    {paymentMethod === "netbanking" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase">Bank Name</label>
                          <select className="w-full p-3 rounded-lg border border-slate-200"><option>Select Bank</option><option>HDFC Bank</option><option>SBI</option><option>ICICI Bank</option></select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Account Number</label><input required type="text" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">IFSC Code</label><input required type="text" className="w-full p-3 rounded-lg border border-slate-200" /></div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "wallet" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Select Wallet</label>
                        <select className="w-full p-3 rounded-lg border border-slate-200"><option>Paytm</option><option>PhonePe</option><option>Amazon Pay</option></select>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingPayment}
                      className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      {processingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Pay ?{currentPaymentJob.amount || 500} Now</span>
                      )}
                    </button>
                  </div>
                </div>
"""

path = r"C:\Users\sumit\.vscode\codes\Month-03\Week-06\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
job_box_end = -1

for i, line in enumerate(lines):
    if "<form onSubmit={handleProcessPayment}" in line:
        start_idx = i
        # The job details box ends around 13 lines later
        job_box_end = i + 14
        
        # Search for closing form tag
        for j in range(i + 1, len(lines)):
            if "</form>" in lines[j]:
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:job_box_end] + [new_form_content + "\n"] + lines[end_idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("SUCCESS")
else:
    print(f"FAILED: start={start_idx}, end={end_idx}")

