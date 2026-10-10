const Footer = () => {
    return (
        <footer className="bg-white border-t border-teal-100 py-6 mt-auto">
            <div className="container mx-auto flex justify-center items-center">
                <p className="text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} <span className="font-bold text-teal-600">BlogSpace</span> — All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;