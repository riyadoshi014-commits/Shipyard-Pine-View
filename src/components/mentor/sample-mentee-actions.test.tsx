import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SampleMenteeActions } from "./sample-mentee-actions";

afterEach(cleanup);

describe("sample mentor actions", () => {
  it("lets a mentor complete a follow-up and records feedback in the demo", () => {
    render(<SampleMenteeActions fullName="Marcus Reed" nextAction="Review portfolio" lastCheckIn="Sep 4" />);

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.getByRole("button", { name: "Completed" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Follow-up marked complete");

    fireEvent.click(screen.getByRole("button", { name: "Record check-in" }));
    expect(screen.getByText("Last check-in: Just now")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Check-in recorded");

    fireEvent.change(screen.getByLabelText("Date and time"), { target: { value: "2026-10-01T09:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule check-in" }));
    expect(screen.getByRole("status")).toHaveTextContent("Check-in scheduled");

    fireEvent.change(screen.getByLabelText("What did you directly observe?"), {
      target: { value: "Marcus described the design decision clearly." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft observation" }));
    expect(screen.getByRole("status")).toHaveTextContent("Draft observation saved");
  });
});
