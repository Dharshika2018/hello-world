import { Route, Routes, Navigate } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

/* public */
import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import Scholarships from './pages/public/Scholarships.jsx';
import ScholarshipDetail from './pages/public/ScholarshipDetail.jsx';
import Events from './pages/public/Events.jsx';
import EventDetail from './pages/public/EventDetail.jsx';
import Contact from './pages/public/Contact.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import NotFound from './pages/public/NotFound.jsx';

/* student portal */
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ApplyWizard from './pages/student/ApplyWizard.jsx';
import MyApplications from './pages/student/MyApplications.jsx';
import ApplicationDetail from './pages/student/ApplicationDetail.jsx';
import VolunteerEvents from './pages/student/VolunteerEvents.jsx';
import MyVolunteering from './pages/student/MyVolunteering.jsx';
import NotificationsPage from './pages/student/NotificationsPage.jsx';
import Profile from './pages/student/Profile.jsx';

/* admin panel */
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminApplications from './pages/admin/AdminApplications.jsx';
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail.jsx';
import AdminScholarships from './pages/admin/AdminScholarships.jsx';
import AdminScholarshipForm from './pages/admin/AdminScholarshipForm.jsx';
import AdminEvents from './pages/admin/AdminEvents.jsx';
import AdminEventForm from './pages/admin/AdminEventForm.jsx';
import AdminVolunteers from './pages/admin/AdminVolunteers.jsx';
import AdminStudents from './pages/admin/AdminStudents.jsx';
import AdminEmails from './pages/admin/AdminEmails.jsx';
import AdminAccounts from './pages/admin/AdminAccounts.jsx';
import AdminCompose from './pages/admin/AdminCompose.jsx';
import AdminSystem from './pages/admin/AdminSystem.jsx';

export default function App() {
  return (
    <Routes>
      {/* ------------------------------------------------------------- public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ------------------------------------------------------ student area */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/apply"
        element={
          <ProtectedRoute role="student">
            <ApplyWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/apply/:scholarshipId"
        element={
          <ProtectedRoute role="student">
            <ApplyWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/applications"
        element={
          <ProtectedRoute role="student">
            <MyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/applications/:id"
        element={
          <ProtectedRoute role="student">
            <ApplicationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/volunteer"
        element={
          <ProtectedRoute role="student">
            <VolunteerEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/volunteering"
        element={
          <ProtectedRoute role="student">
            <MyVolunteering />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute role="student">
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute role="student">
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* -------------------------------------------------------- admin area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute role="admin">
            <AdminApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminApplicationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scholarships"
        element={
          <ProtectedRoute role="admin">
            <AdminScholarships />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scholarships/new"
        element={
          <ProtectedRoute role="admin">
            <AdminScholarshipForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scholarships/:id/edit"
        element={
          <ProtectedRoute role="admin">
            <AdminScholarshipForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute role="admin">
            <AdminEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <ProtectedRoute role="admin">
            <AdminEventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:id/edit"
        element={
          <ProtectedRoute role="admin">
            <AdminEventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/volunteers"
        element={
          <ProtectedRoute role="admin">
            <AdminVolunteers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute role="admin">
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/emails"
        element={
          <ProtectedRoute role="admin">
            <AdminEmails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/compose"
        element={
          <ProtectedRoute role="admin">
            <AdminCompose />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounts"
        element={
          <ProtectedRoute role="admin">
            <AdminAccounts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system"
        element={
          <ProtectedRoute role="admin">
            <AdminSystem />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
