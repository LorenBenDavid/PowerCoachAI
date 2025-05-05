"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ChatWidget() {
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"init" | "custom">("init");
  const [latestMessage, setLatestMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"exercise" | "food" | null>(
    null
  );

  const saveFeedback = useMutation(api.plans.saveUserFeedback);

  if (!isLoaded || !user) return null;

  const handleSubmit = async (input: string) => {
    if (!feedbackType) return;
    try {
      await saveFeedback({
        userId: user.id,
        type: feedbackType,
        text: input,
      });
      setLatestMessage("Got it. Next plan’s gonna hit different.");
    } catch (err) {
      console.error(err);
      setLatestMessage("Error saving your request.");
    }
  };

  const getPlaceholder = () => {
    return feedbackType === "food"
      ? "Food you'd like to change"
      : "Exercise you'd like to change";
  };

  return (
    <div>
      <button
        onClick={() => {
          setOpen(!open);
          setStep("init");
          setLatestMessage("");
        }}
        className="fixed bottom-4 right-4 bg-primary text-white rounded-full w-14 h-14 shadow-lg text-xl flex items-center justify-center z-50"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-80 max-w-sm p-4 bg-primary/20 backdrop-blur-sm shadow-2xl border border-border rounded-lg z-50">
          <div className="mb-18 mt-6 text-xl font-bold text-white text-center">
            {step === "init" ? (
              "Bar loaded. What are we changing today?"
            ) : (
              <>
                Where’s the weak link?
                <br />
                Let’s fix it.
              </>
            )}
          </div>

          {step === "init" && (
            <>
              <div className="mb-3 text-sm font-mono text-muted-foreground text-center">
                Make your pick, lifter:
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setFeedbackType("food");
                    setStep("custom");
                  }}
                  className="font-mono text-white border border-primary bg-purple-300/30 backdrop-blur-sm shadow-xl hover:bg-primary/10"
                >
                  Tweak a Meal
                </Button>
                <Button
                  onClick={() => {
                    setFeedbackType("exercise");
                    setStep("custom");
                  }}
                  className="font-mono text-white border border-primar bg-purple-300/30 backdrop-blur-sm shadow-xl hover:bg-primary/10"
                >
                  Swap an Exercise
                </Button>
              </div>
            </>
          )}

          {step === "custom" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (
                  e.currentTarget.elements.namedItem(
                    "feedback"
                  ) as HTMLInputElement
                ).value;
                handleSubmit(input);
              }}
              className="mt-12"
            >
              <input
                name="feedback"
                type="text"
                placeholder={getPlaceholder()}
                className="w-full border border-border rounded px-3 py-2 text-sm text-white placeholder:text-purple-300 font-mono bg-background/50"
              />
              <div className="flex justify-center mt-5">
                <Button
                  type="submit"
                  className="font-mono text-white  border border-primary bg-purple-300/30 backdrop-blur-sm shadow-xl hover:bg-primary/10"
                >
                  Submit
                </Button>
              </div>
              {latestMessage && (
                <p className="mt-3 text-sm font-mono text-purple-300 text-center">
                  {latestMessage}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
