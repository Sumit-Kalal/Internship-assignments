                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Method</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'upi', label: 'UPI', icon: '💳' },
                      { id: 'card', label: 'Card', icon: '🏦' },
                      { id: 'netbanking', label: 'Net Banking', icon: '🏧' },
                      { id: 'wallet', label: 'Wallet', icon: '👝' }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`py-3 px-3 rounded-xl text-center transition-all border-2 font-bold text-sm ${
                          paymentMethod === method.id
                            ? 'border-blue-600 bg-blue-100 text-blue-800 shadow-lg'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300'
                        }`}
                        disabled={processing}
                      >
                        <span className="text-lg mb-1 block">{method.icon}</span>
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</span>
                      <input
                        type="text"
                        value={payerDetails.cardholderName}
                        onChange={(e) => setPayerDetails({ ...payerDetails, cardholderName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                        disabled={processing}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</span>
                      <input
                        type="email"
                        value={payerDetails.email}
                        onChange={(e) => setPayerDetails({ ...payerDetails, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@example.com"
                        disabled={processing}
                      />
                    </label>

                    <label className="md:col-span-2 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone Number</span>
                      <input
                        type="tel"
                        value={payerDetails.phone}
                        onChange={(e) => setPayerDetails({ ...payerDetails, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="9876543210"
                        maxLength="10"
                        disabled={processing}
                      />
                    </label>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <label className="md:col-span-2 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Card Number</span>
                        <input
                          type="text"
                          value={payerDetails.cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\s/g, '').slice(0, 19);
                            const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                            setPayerDetails({ ...payerDetails, cardNumber: formatted });
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                          placeholder="1234 5678 9012 3456"
                          maxLength="23"
                          disabled={processing}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Expiry (MM/YY)</span>
                        <input
                          type="text"
                          value={payerDetails.expiryDate}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (val.length >= 2) {
                              setPayerDetails({ ...payerDetails, expiryDate: `${val.slice(0, 2)}/${val.slice(2, 4)}` });
                            } else {
                              setPayerDetails({ ...payerDetails, expiryDate: val });
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="12/25"
                          maxLength="5"
                          disabled={processing}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">CVV</span>
                        <input
                          type="text"
                          value={payerDetails.cvv}
                          onChange={(e) => setPayerDetails({ ...payerDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                          placeholder="123"
                          maxLength="4"
                          disabled={processing}
                        />
                      </label>

                      <label className="md:col-span-2 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Billing Address</span>
                        <input
                          type="text"
                          value={payerDetails.address}
                          onChange={(e) => setPayerDetails({ ...payerDetails, address: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="123 Main St, City, State ZIP"
                          disabled={processing}
                        />
                      </label>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">UPI ID</span>
                        <input
                          type="text"
                          value={payerDetails.upiId}
                          onChange={(e) => setPayerDetails({ ...payerDetails, upiId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="yourname@upi"
                          disabled={processing}
                        />
                        <p className="text-xs text-orange-600 font-medium mt-2">💡 Enter your UPI ID (e.g., mobile@upi, google@upi, paytm@upi)</p>
                      </label>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <label className="md:col-span-2 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bank Name</span>
                        <input
                          type="text"
                          value={payerDetails.bankName}
                          onChange={(e) => setPayerDetails({ ...payerDetails, bankName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="HDFC Bank"
                          disabled={processing}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Number</span>
                        <input
                          type="text"
                          value={payerDetails.accountNumber}
                          onChange={(e) => setPayerDetails({ ...payerDetails, accountNumber: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                          placeholder="1234567890123"
                          disabled={processing}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IFSC Code</span>
                        <input
                          type="text"
                          value={payerDetails.ifscCode}
                          onChange={(e) => setPayerDetails({ ...payerDetails, ifscCode: e.target.value.toUpperCase().slice(0, 11) })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                          placeholder="HDFC0001234"
                          maxLength="11"
                          disabled={processing}
                        />
                      </label>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Wallet Provider</span>
                        <select
                          value={payerDetails.walletProvider}
                          onChange={(e) => setPayerDetails({ ...payerDetails, walletProvider: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          disabled={processing}
                        >
                          <option value="">Choose a wallet...</option>
                          <option value="Google Pay">Google Pay</option>
                          <option value="WhatsApp Pay">WhatsApp Pay</option>
                          <option value="Amazon Pay">Amazon Pay</option>
                          <option value="Apple Pay">Apple Pay</option>
                          <option value="Samsung Pay">Samsung Pay</option>
                          <option value="Paytm">Paytm Wallet</option>
                          <option value="PhonePe">PhonePe</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
