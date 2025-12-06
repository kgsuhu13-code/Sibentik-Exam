import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPages';
import TeacherLayout from './components/TeacherLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import QuestionBankPage from './pages/QuestionBankPage';
import QuestionEditorPage from './pages/QuestionEditorPage';
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
                        <Route path="/login" element={<LoginPage />} />

                        {/* Rute Guru (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                            <Route element={<TeacherLayout />}>
                                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                                <Route path="/question-bank" element={<QuestionBankPage />} />
                                <Route path="/exam-schedule" element={<ExamSchedulePage />} />
                                <Route path="/monitoring" element={<MonitoringDashboardPage />} />
                                <Route path="/students" element={<PlaceholderPage title="Data Siswa" />} />
                                <Route path="/grades" element={<PlaceholderPage title="Hasil & Nilai" />} />
                                <Route path="/settings" element={<PlaceholderPage title="Pengaturan" />} />
                            </Route>

                            {/* Rute Editor Soal (Full Screen) */}
                            <Route path="/question-bank/:id" element={<QuestionEditorPage />} />
                            <Route path="/exam-monitor/:id" element={<ExamMonitorPage />} />
                            <Route path="/exam/:examId/review/:studentId" element={<ExamReviewPage />} />
                        </Route>

                        {/* Rute Siswa (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                            <Route element={<StudentLayout />}>
                                <Route path="/student-dashboard" element={<StudentDashboard />} />
                                <Route path="/student-exams" element={<StudentExamsPage />} />
                                <Route path="/student-history" element={<StudentHistoryPage />} />
                            </Route>
                            {/* Exam Interface (Full Screen) */}
                            <Route path="/exam/:id" element={<StudentExamPage />} />
                        </Route>

                        {/* Rute Admin (Protected) */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/master-data" element={<PlaceholderPage title="Data Master" />} />
                                <Route path="/admin/users" element={<PlaceholderPage title="Manajemen User" />} />
                                <Route path="/admin/monitoring" element={<PlaceholderPage title="Monitoring Global" />} />
                                <Route path="/admin/settings" element={<PlaceholderPage title="Pengaturan Sistem" />} />
                            </Route>
                        </Route>

                        {/* Default redirect ke login */}
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;