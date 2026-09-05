import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryHome } from "./story-home";

beforeEach(() => {
  // Simulate the native dialog boundary; browser playback itself is not
  // available in jsdom. Check lazy media, captions and focus restoration.
  vi.stubGlobal("React", React);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("story playback", () => {
  it("only loads a film after choosing it and restores focus after closing", () => {
    const { container } = render(<StoryHome />);
    expect(container.querySelector("video")).toBeNull();
    const opener = screen.getByRole("button", { name: /Meet Nick/ });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(container.querySelector("video")).toHaveAttribute("src", "/stories/nick.mp4");
    expect(container.querySelector("video")).toHaveAttribute("controls");
    expect(container.querySelector("track")).toHaveAttribute("src", "/stories/nick.vtt");
    fireEvent.click(screen.getByRole("button", { name: "Close video" }));
    expect(container.querySelector("video")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("selects each portrait film and removes it when the dialog is cancelled", () => {
    const { container } = render(<StoryHome />);
    for (const [label, file] of [[/Watch a conversation with Adam/, "adam"], [/Watch a moment at the card table/, "cards"]] as const) {
      const opener = screen.getByRole("button", { name: label });
      fireEvent.click(opener);
      expect(container.querySelector("video")).toHaveAttribute("src", `/stories/${file}.mp4`);
      expect(container.querySelector("track")).toHaveAttribute("label", "English (auto-generated)");
      fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false }));
      expect(container.querySelector("video")).toBeNull();
      expect(opener).toHaveFocus();
    }
  });

  it("navigates story chapters with the keyboard and plays the chosen moment", () => {
    const { container } = render(<StoryHome />);
    const firstChapter = screen.getByRole("tab", { name: /The work/ });
    firstChapter.focus();
    fireEvent.keyDown(firstChapter, { key: "ArrowRight" });
    const peopleChapter = screen.getByRole("tab", { name: /The people/ });
    expect(peopleChapter).toHaveFocus();
    expect(peopleChapter).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(/The people/);
    const opener = screen.getByRole("button", { name: /Watch this moment/ });
    fireEvent.click(opener);
    const video = container.querySelector("video")!;
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(102);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Close video" }));
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(opener).toHaveFocus();

    // A subsequent full-story opening must start at the beginning.
    fireEvent.click(screen.getByRole("button", { name: /Meet Nick/ }));
    const fullFilm = container.querySelector("video")!;
    fireEvent.loadedMetadata(fullFilm);
    expect(fullFilm.currentTime).toBe(0);
  });

  it("dismisses mobile navigation with Escape and returns focus to its button", () => {
    render(<StoryHome />);
    const menu = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menu);
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveFocus();
  });
});
