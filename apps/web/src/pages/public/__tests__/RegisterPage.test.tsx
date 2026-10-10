import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../../../lib/apiClient";
import { RegisterPage } from "../RegisterPage";
import { LocaleProvider } from "../../../context/LocaleContext";

const register = vi.fn();
const navigate = vi.fn();

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ register }),
}));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

beforeEach(() => {
  register.mockReset();
  navigate.mockReset();
});

function renderPage() {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </LocaleProvider>
  );
}

describe("RegisterPage", () => {
  it("submits the entered fields and navigates home on success", async () => {
    register.mockResolvedValueOnce({ id: "u1", name: "Jane", email: "jane@test.com", role: "CUSTOMER" });
    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Full name"), "Jane Buyer");
    await userEvent.type(screen.getByPlaceholderText("Email"), "jane@test.com");
    await userEvent.type(screen.getByPlaceholderText(/Password/), "SecurePass123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      name: "Jane Buyer",
      email: "jane@test.com",
      password: "SecurePass123!",
    });
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("shows the API error message and does not navigate when registration fails", async () => {
    register.mockRejectedValueOnce(new ApiError(409, "An account with this email already exists"));
    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Full name"), "Jane Buyer");
    await userEvent.type(screen.getByPlaceholderText("Email"), "jane@test.com");
    await userEvent.type(screen.getByPlaceholderText(/Password/), "SecurePass123!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("An account with this email already exists")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
