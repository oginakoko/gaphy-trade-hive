
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";

const AdminPage = () => {
  return (
    <>
      <Header />
      <div className="py-8 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-white mb-8">Admin Panel</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Manage Trade Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Post new trade ideas and manage existing ones.</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Approve Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Review and approve or reject user-submitted ads.</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Manage Affiliate Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Add, edit, or remove affiliate links and resources.</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">View Donations Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">See a log of all donations made.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
