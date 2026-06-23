import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";

function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="w-full max-w-lg space-y-4 px-6 py-8">
      <h1 className="font-semibold text-2xl text-foreground">Home</h1>
      {user && (
        <p className="text-muted-foreground" data-testid="user-email">
          Signed in as {user.email}
        </p>
      )}
      <Button type="button" data-testid="logout-btn" variant="outline" onClick={() => void logout()}>
        Log out
      </Button>
    </div>
  );
}

export default Home;
