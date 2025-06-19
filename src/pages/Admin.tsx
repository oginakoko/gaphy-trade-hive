import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { Link } from "react-router-dom";

const AdminPage = () => {
  return (
    <>
      <Header />
      <div className="py-8 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Panel</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link to="/admin/trade-ideas">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">Manage Trade Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Post new trade ideas and manage existing ones.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/ads">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">Approve Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Review and approve or reject user-submitted ads.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/affiliate-links">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">Manage Affiliate Links</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Add, edit, or remove affiliate links and resources.</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/messages">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">User Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Message any user directly and send broadcast announcements.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/donations">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">View Donations Log</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">See a log of all donations made.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/users">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">Manage Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">View users, grant admin rights, or ban users.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/api-keys">
            <Card className="glass-card h-full hover:border-brand-green/50 transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-white">Manage API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Set keys for services like Google Gemini.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
