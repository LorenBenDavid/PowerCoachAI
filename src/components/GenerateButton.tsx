"use client";

import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateButton({
  currentPlan,
  submittedDays,
  allPlans,
  onNewPlan,
  rpeInputs,
  disabled,
}: {
  currentPlan: any;
  submittedDays: Set<string>;
  allPlans: any[];
  onNewPlan: (newPlan: any) => void;
  rpeInputs: { [key: string]: string };
  disabled?: boolean;
}) {
  const { user } = useUser();
  const userId = user?.id as string;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const allDays =
    currentPlan?.workoutPlan.exercises.map((ex: any) => ex.day) || [];

  const disableGenerate =
    loading || !allDays.every((day: any) => submittedDays.has(day));

  return (
    <Button
      className="mt-4 w-full text-xs font-mono"
      variant="outline"
      disabled={disabled || loading}
      onClick={async () => {
        const allSubmitted =
          currentPlan?.workoutPlan.exercises.every((exercise: any) =>
            exercise.routines.every(
              (_: any, routineIndex: number) =>
                rpeInputs?.[`${exercise.day}-${routineIndex}`]?.trim() !== ""
            )
          ) ?? false;

        if (!allSubmitted) {
          toast.error("You must submit RPE for every exercise in every day.");
          return;
        }

        setLoading(true);

        try {
          const response = await fetch("/api/generate-week", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              previousPlanId: currentPlan._id,
              age: currentPlan.age,
              height: currentPlan.height,
              weight: currentPlan.weight,
              injuries: currentPlan.injuries,
              workout_days: currentPlan.workout_days,
              fitness_goal: currentPlan.fitness_goal,
              fitness_level: currentPlan.fitness_level,
              dietary_restrictions: currentPlan.dietary_restrictions,
              gender: currentPlan.gender,
            }),
          });

          const json = await response.json();

          if (json.success) {
            toast.success("New week generated!");
            localStorage.removeItem("rpeInputs");
            router.push("/profile");
            onNewPlan(json.data);
          } else {
            toast.error("Failed to generate week.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Something went wrong.");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading && (
        <Loader2 className="animate-spin mr-2 h-4 w-4 text-primary" />
      )}
      Generate Week {allPlans?.length + 1}
    </Button>
  );
}
