import { BrowserRouter as Router } from "react-router-dom";
import Banner from "./components/Banner/Banner.jsx";
import AppRoutes from "./AppRoutes.jsx";

function App() {
    return (
        <Router basename="/miss-geyers-classroom">
            <Banner />
            <AppRoutes />
        </Router>
    );
}

export default App;
