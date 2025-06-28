import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, BookOpen, MessageSquare, BrainCircuit, Shield, ChevronLeft, ChevronRight, Trophy
} from 'lucide-react';
import logo from '/logo.jpg';

const sidebarVariants = {
    open: { width: '16rem', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { width: '5rem', transition: { type: 'spring', stiffness: 300, damping: 30 } }
};

const navItemVariants = {
    open: { opacity: 1, x: 0, transition: { delay: 0.1 } },
    closed: { opacity: 0, x: -20 }
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { userData } = useAuth();
    const { pathname } = useLocation();

    const navLinks = [
        { name: 'Anasayfa', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Dersler', path: '/dashboard/lessons', icon: BookOpen },
        { name: 'AI Koç', path: '/dashboard/coaches', icon: MessageSquare },
        { name: 'Soru Çöz', path: '/dashboard/question-solver', icon: BrainCircuit },
        { name: 'Skor Tablosu', path: '/dashboard/leaderboard', icon: Trophy },
    ];
    
    const adminNav = userData?.role === 'admin' ? [
        { name: 'Admin Panel', path: '/dashboard/admin', icon: Shield },
    ] : [];

    return (
        <motion.aside
            variants={sidebarVariants}
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            className="relative flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
        >
            <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700" style={{ minHeight: '64px' }}>
                <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
                    <img src={logo} alt="NeutralEdu Logo" className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                    <AnimatePresence>
                    {isOpen && (
                        <motion.span
                            variants={navItemVariants}
                            initial="closed" animate="open" exit="closed"
                            className="font-bold text-xl text-gray-900 dark:text-white whitespace-nowrap"
                        >
                            NeutralEdu
                        </motion.span>
                    )}
                    </AnimatePresence>
                </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <nav className="flex flex-col gap-2 px-4 py-4">
                    {[...navLinks, ...adminNav].map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                        return (
                            <Link to={item.path} key={item.name} title={isOpen ? undefined : item.name}
                                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
                                isActive 
                                    ? 'bg-primary-600 text-white shadow-md' 
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}>
                                <item.icon className="w-6 h-6 flex-shrink-0" />
                                <AnimatePresence>
                                {isOpen && (
                                    <motion.span
                                        variants={navItemVariants}
                                        initial="closed"
                                        animate="open"
                                        exit="closed"
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </motion.aside>
    );
};

export default Sidebar; 