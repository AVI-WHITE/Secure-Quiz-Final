import { useState } from "react";
import DashboardNavbar from "./DashboardNavbar";
import QuestionBank from "./admin/QuestionBank";
import ExamManager from "./admin/ExamManager";
import ResultsViewer from "./admin/ResultsViewer";

const tabs = [
  { label: "Dashboard", id: "dashboard" },
  { label: "Question Bank", id: "questions" },
  { label: "Manage Exams", id: "exams" },
  { label: "Results", id: "results" },
];

const AdminDashboard = () => {
  const [active, setActive] = useState("dashboard");

  const renderContent = () => {
    switch (active) {
      case "questions": return <QuestionBank />;
      case "exams": return <ExamManager />;
      case "results": return <ResultsViewer />;
      default:
        return (
          <div className="border border-border rounded p-6 text-center text-muted-foreground text-sm">
            Welcome to the Admin Dashboard. Use the tabs above to manage questions, exams, and view results.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavbar />
      <div className="flex flex-1">
        <aside className="w-40 border-r border-border hidden md:flex flex-col p-2 gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`text-left px-3 py-2 rounded text-sm ${
                active === t.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl space-y-3">
            <h1 className="text-lg font-bold text-foreground">
              {tabs.find((t) => t.id === active)?.label}
            </h1>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
