import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Calendar, Clock, MapPin, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { station, date, startTime, endTime, userDetails } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [upiId, setUpiId] = useState("");

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card" && !cardNumber) {
      toast.error("Please enter card details");
      return;
    }
    if (paymentMethod === "upi" && !upiId) {
      toast.error("Please enter UPI ID");
      return;
    }

    toast.success("Payment successful! Your booking is confirmed.");
    setTimeout(() => {
      navigate("/my-bookings");
    }, 2000);
  };

  if (!station) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p>No booking information found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          {/* Booking Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Station</p>
                  <p className="font-medium">{station.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{format(date, "MMMM dd, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Time Range</p>
                  <p className="font-medium">{startTime} - {endTime}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{((() => {
                      const start = startTime.split(':').map(Number);
                      const end = endTime.split(':').map(Number);
                      const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
                      return Math.max(0, hours * (station.pricePerHour || 50)).toFixed(2);
                    })())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <span>Credit / Debit Card</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span>UPI</span>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" required />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Pay ₹{((() => {
                    const start = startTime.split(':').map(Number);
                    const end = endTime.split(':').map(Number);
                    const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
                    return Math.max(0, hours * (station.pricePerHour || 50)).toFixed(2);
                  })())}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
