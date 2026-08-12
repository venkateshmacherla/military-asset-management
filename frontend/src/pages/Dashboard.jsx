import Header from "../components/Header";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>

          <p className="mt-1 text-sm text-slate-500">
            Overview of military assets and operations.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Assets</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Active Assignments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Transfers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Expenditure</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">₹0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Quick Actions
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Assets</p>
              <p className="mt-1 text-sm text-slate-500">
                View and manage assets
              </p>
            </button>

            <button className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Transfers</p>
              <p className="mt-1 text-sm text-slate-500">
                Manage asset transfers
              </p>
            </button>

            <button className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Assignments</p>
              <p className="mt-1 text-sm text-slate-500">Manage assignments</p>
            </button>

            <button className="rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50">
              <p className="font-semibold text-slate-900">Reports</p>
              <p className="mt-1 text-sm text-slate-500">View system reports</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
