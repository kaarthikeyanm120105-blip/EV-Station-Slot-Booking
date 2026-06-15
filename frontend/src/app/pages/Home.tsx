import { Search, MapPin, Zap, Shield, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
  const stations = [
    {
      id: 1,
      name: "Green Valley Charging Hub",
      location: "123 Main Street, Downtown",
      available: 5,
      total: 8,
      price: "$5/hour",
    },
    {
      id: 2,
      name: "City Center EV Station",
      location: "456 Oak Avenue, City Center",
      available: 3,
      total: 6,
      price: "$6/hour",
    },
    {
      id: 3,
      name: "Eco Park Charging Point",
      location: "789 Pine Road, Eco Park",
      available: 7,
      total: 10,
      price: "$4/hour",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Fast Charging",
      description: "High-speed charging stations for quick power-ups",
    },
    {
      icon: Search,
      title: "Easy Booking",
      description: "Find and book charging stations in just a few clicks",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "Safe and encrypted payment processing",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzczOTA2MjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Electric vehicle charging"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find & Book EV Charging Stations Easily
            </h1>
            <p className="text-xl mb-8">
              Discover nearby charging stations and reserve your spot in seconds
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter your location"
                  className="pl-10 h-12"
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700 h-12 px-8">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Stations Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nearby Charging Stations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <Card key={station.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{station.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{station.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">Available Ports:</span>
                      <p className="text-lg font-semibold text-green-600">
                        {station.available}/{station.total}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Price:</span>
                      <p className="text-lg font-semibold">{station.price}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/stations/${station.id}`} className="w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/stations">
              <Button variant="outline" size="lg">
                View All Stations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
