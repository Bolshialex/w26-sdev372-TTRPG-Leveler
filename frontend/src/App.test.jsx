import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import apiService from "./services/apiService";
import { useUser } from "./context/UserContext";

// 1. Mock the API Service
vi.mock("./services/apiService", () => ({
  default: {
    setAuthToken: vi.fn(),
  },
}));

// 2. Mock the User Context
vi.mock("./context/UserContext", () => ({
  UserProvider: ({ children }) => (
    <div data-testid="user-provider">{children}</div>
  ),
  useUser: vi.fn(),
}));

// 3. Mock Child Components to avoid rendering their complex logic
vi.mock("./components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));
vi.mock("./components/CharacterList", () => ({
  default: () => <div data-testid="mock-character-list">Character List</div>,
}));

describe("App Component", () => {
  beforeEach(() => {
    // Clear mocks before each test to ensure clean state
    vi.clearAllMocks();
  });

  it("renders the UserProvider, Header, and default route (CharacterList)", () => {
    // Simulate a logged-out user
    useUser.mockReturnValue({ user: null });

    render(<App />);

    expect(screen.getByTestId("user-provider")).toBeInTheDocument();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-character-list")).toBeInTheDocument();
  });

  it("calls apiService.setAuthToken when a user with a token is present", () => {
    const fakeToken = "12345-abcde";

    // Simulate a logged-in user with a token
    useUser.mockReturnValue({
      user: { token: fakeToken, name: "Test User" },
    });

    render(<App />);

    // Verify the useEffect logic fired correctly
    expect(apiService.setAuthToken).toHaveBeenCalledTimes(1);
    expect(apiService.setAuthToken).toHaveBeenCalledWith(fakeToken);
  });

  it("does NOT call apiService.setAuthToken when user has no token", () => {
    // Simulate a user object that exists but has no token
    useUser.mockReturnValue({
      user: { name: "Tokenless User" },
    });

    render(<App />);

    expect(apiService.setAuthToken).not.toHaveBeenCalled();
  });
});
