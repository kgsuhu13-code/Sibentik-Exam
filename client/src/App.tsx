import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPages';
import LandingPage from './pages/LandingPage';
import TeacherLayout from './components/TeacherLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import QuestionBankPage from './pages/QuestionBankPage';
import QuestionEditorPage from './pages/QuestionEditorPage';
import PublicBankPreviewPage from './pages/PublicBankPreviewPage';
import ExamSchedulePage from './pages/ExamSchedulePage';
import ExamMonitorPage from './pages/ExamMonitorPage';
import ExamReviewPage from './pages/ExamReviewPage';
import MonitoringDashboardPage from './pages/MonitoringDashboardPage';
import StudentLayout from './components/StudentLayout';
import StudentDashboard from './pages/StudentDashboard';
import StudentExamPage from './pages/StudentExamPage';
import StudentExamsPage from './pages/StudentExamsPage';
import StudentHistoryPage from './pages/StudentHistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchoolsPage from './pages/AdminSchoolsPage';
import AdminSchoolDetailPage from './pages/AdminSchoolDetailPage';
import TeacherGradesPage from './pages/TeacherGradesPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import TeacherSettingsPage from './pages/TeacherSettingsPage';

// Komponen Dummy untuk Placeholder Menu Lain
const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="p-10 bg-white rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{title}</h1>
        <p className="text-slate-500">Halaman ini sedang dalam pengembangan.</p>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <Routes>
                        {/* Halaman Landing Page (Public) */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Halaman Login */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Rute Guru (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                            <Route element={<TeacherLayout />}>
                                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                                <Route path="/question-bank" element={<QuestionBankPage />} />
                                <Route path="/exam-schedule" element={<ExamSchedulePage />} />
                                <Route path="/monitoring" element={<MonitoringDashboardPage />} />
                                <Route path="/students" element={<TeacherStudentsPage />} />
                                <Route path="/grades" element={<TeacherGradesPage />} />
                                <Route path="/settings" element={<TeacherSettingsPage />} />
                            </Route>

                            {/* Rute Editor Soal (Full Screen) */}
                            <Route path="/question-bank/:id" element={<QuestionEditorPage />} />
                            <Route path="/question-bank/:id/preview" element={<PublicBankPreviewPage />} />
                            <Route path="/exam-monitor/:id" element={<ExamMonitorPage />} />
                            <Route path="/exam/:examId/review/:studentId" element={<ExamReviewPage />} />
                        </Route>

                        {/* Rute Siswa (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                            {/* Dashboard & Halaman Utama Siswa (Full Screen Mobile Style) */}
                            <Route path="/student-dashboard" element={<StudentDashboard />} />
                            <Route path="/student-exams" element={<StudentExamsPage />} />
                            <Route path="/student-history" element={<StudentHistoryPage />} />

                            {/* StudentLayout tetap ada jika dibutuhkan nanti */}
                            <Route element={<StudentLayout />}>
                                {/* Future pages */}
                            </Route>

                            {/* Exam Interface (Full Screen) */}
                            <Route path="/exam/:id" element={<StudentExamPage />} />
                        </Route>

                        {/* Rute Admin (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/schools" element={<AdminSchoolsPage />} />
                                <Route path="/admin/schools/:id" element={<AdminSchoolDetailPage />} />
                                <Route path="/admin/master-data" element={<PlaceholderPage title="Data Master" />} />
                                <Route path="/admin/users" element={<PlaceholderPage title="Manajemen User" />} />
                                <Route path="/admin/monitoring" element={<PlaceholderPage title="Monitoring Global" />} />
                                <Route path="/admin/settings" element={<PlaceholderPage title="Pengaturan Sistem" />} />
                            </Route>
                        </Route>

                        {/* Default redirect ke Landing Page */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;