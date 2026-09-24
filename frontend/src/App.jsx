import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Admission from './pages/Admission';
import Contact from './pages/Contact';
import Apply from './pages/Apply';
import Status from './pages/Status';
import Signin from './pages/admin/Signin';
import ResetPassword from './pages/admin/ResetPassword';
import Dashboard from './pages/admin/Dashboard';
import AdminPrograms from './pages/admin/Programs';
import AdminApplicants from './pages/admin/Applicants';
import ApplicantDetail from './pages/admin/ApplicantDetail';
import AdminInterviews from './pages/admin/Interviews';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminGallery from './pages/admin/Gallery';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes first so /login is never swallowed by the public layout */}
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<Navigate to="/signin" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="applicants" element={<AdminApplicants />} />
              <Route path="applicants/:id" element={<ApplicantDetail />} />
              <Route path="interviews" element={<AdminInterviews />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="gallery" element={<AdminGallery />} />
            </Route>

            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="programs" element={<Programs />} />
              <Route path="admission" element={<Admission />} />
              <Route path="contact" element={<Contact />} />
              <Route path="apply" element={<Apply />} />
              <Route path="status" element={<Status />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
