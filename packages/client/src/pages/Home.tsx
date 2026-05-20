import { Navigate } from "react-router-dom";

function Home() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <h1 className="font-semibold text-2xl text-foreground">Home</h1>
  );
}

export default Home;
