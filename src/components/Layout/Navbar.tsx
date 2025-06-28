import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import { useTheme } from '../../contexts/ThemeContext';

interface NavbarProps {
    toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 md:px-6">
            <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Toggle Sidebar"
            >
                <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle Theme"
                    title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
                >
                    {isDark ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
                
                <UserProfileDropdown />
            </div>
        </header>
    );
};

export default Navbar;