"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import ProfileHeader from "../../components/ProfileHeader";
import NoFitnessPlan from "../../components/NoFitnessPlan";
import CornerElements from "../../components/CornerElements";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { AppleIcon, CalendarIcon, DumbbellIcon, Send } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

import GenerateButton from "../../components/GenerateButton";

const ProfilePage = () => {
  const [rpeInputs, setRpeInputs] = useState<{ [key: string]: string }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rpeInputs");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rpeInputs", JSON.stringify(rpeInputs));
    }
  }, [rpeInputs]);

  const [submittedDays, setSubmittedDays] = useState<Set<string>>(new Set());
  const updateRpe = useMutation(api.plans.updateRpeForRoutine);

  const { user } = useUser();
  const userId = user?.id as string;

  const allPlans = useQuery(api.plans.getUserPlans, { userId });
  const [selectedPlanId, setSelectedPlanId] = useState<null | string>(null);

  const activePlan = allPlans?.find((plan) => plan.isActive);

  const currentPlan = selectedPlanId
    ? allPlans?.find((plan) => plan._id === selectedPlanId)
    : activePlan;

  const allDaysSubmitted =
    !!currentPlan &&
    currentPlan.workoutPlan.exercises.every((ex) => submittedDays.has(ex.day));

  const handleNewPlan = (newPlan: any) => {
    setSelectedPlanId(newPlan._id);
    setRpeInputs({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("rpeInputs");
      window.location.href = "/profile";
    }
  };
  const sortedPlans = [...(allPlans || [])].sort(
    (a, b) => b._creationTime - a._creationTime
  );

  const [activeTab, setActiveTab] = useState("workout");

  return (
    <section className="relative z-10 pt-12 pb-32 flex-grow container mx-auto px-4">
      <ProfileHeader user={user} />
      {allPlans && allPlans.length > 0 ? (
        <div className="space-y-8">
          {/* PLANS */}
          <div className="relative backdrop-blur-sm border border-border p-6">
            <CornerElements />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">
                <span className="text-primary">Your</span>{" "}
                <span className="text-foreground">Powerlifting Plans</span>
              </h2>
              <div className="font-mono text-xs text-muted-foreground">
                TOTAL: {allPlans.length}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedPlans.map((plan, index) => (
                <Button
                  key={plan._id}
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`text-foreground border hover:text-white ${
                    selectedPlanId === plan._id
                      ? "bg-primary/20 text-primary border-primary"
                      : "bg-transparent border-border hover:border-primary/50"
                  }`}
                >
                  {`Week ${sortedPlans.length - index} – ${new Date(
                    plan._creationTime
                  ).toLocaleDateString("en-US")}`}
                  {plan.isActive && (
                    <span className="ml-2 bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* PLAN DETAILS */}
          {currentPlan && (
            <div className="relative backdrop-blur-sm border border-border rounded-lg p-6">
              <CornerElements />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <h3 className="text-lg font-bold">
                    PLAN:{" "}
                    <span className="text-primary">{`Week ${sortedPlans.length - sortedPlans.findIndex((p) => p._id === currentPlan._id)} – ${new Date(
                      currentPlan._creationTime
                    ).toLocaleDateString("en-US")}`}</span>
                  </h3>
                </div>
                <div className="flex-1 ml-70"></div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                defaultValue="workout"
              >
                <TabsList className="mb-6 w-full grid grid-cols-2 bg-cyber-terminal-bg border">
                  <TabsTrigger
                    value="workout"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    <DumbbellIcon className="mr-2 size-4" />
                    Workout Plan
                  </TabsTrigger>
                  <TabsTrigger
                    value="diet"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    <AppleIcon className="mr-2 h-4 w-4" />
                    Diet Plan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workout">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm text-muted-foreground">
                        SCHEDULE: {currentPlan.workoutPlan.schedule.join(", ")}
                      </span>
                    </div>

                    <Accordion type="multiple" className="space-y-4">
                      {currentPlan.workoutPlan.exercises.map(
                        (exerciseDay, index) => (
                          <AccordionItem
                            key={index}
                            value={exerciseDay.day}
                            className="border rounded-lg overflow-hidden"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/10 font-mono">
                              <div className="flex justify-between w-full items-center">
                                <span className="text-primary">
                                  {exerciseDay.day}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {exerciseDay.routines.length} EXERCISES
                                </div>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="pb-4 px-4">
                              <div className="space-y-3 mt-2">
                                {exerciseDay.routines.map(
                                  (routine, routineIndex) => (
                                    <div
                                      key={routineIndex}
                                      className="border border-border rounded p-3 bg-background/50"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-foreground">
                                          {routine.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min={1}
                                            max={11}
                                            placeholder="RPE"
                                            value={
                                              rpeInputs[
                                                `${exerciseDay.day}-${routineIndex}`
                                              ] || ""
                                            }
                                            onChange={(e) => {
                                              const val = Number(
                                                e.target.value
                                              );
                                              if (val >= 1 && val <= 11) {
                                                setRpeInputs({
                                                  ...rpeInputs,
                                                  [`${exerciseDay.day}-${routineIndex}`]:
                                                    e.target.value,
                                                });
                                              }
                                            }}
                                            className="w-17 h-5.5 rounded bg-purple-100 text-purple-800 text-center placeholder:text-purple-400 text-xs font-mono"
                                          />
                                          <div className="  px-2 py-1 w-17 h-5.5 rounded bg-purple-200 text-purple-900 text-xs font-mono">
                                            {routine.working_weights
                                              ? `${routine.working_weights} KG`
                                              : "--"}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-mono">
                                              {routine.sets} SETS
                                            </div>
                                            <div className="px-2 py-1 rounded bg-secondary/20 text-secondary text-xs font-mono">
                                              {routine.reps} REPS
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      {routine.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {routine.description}
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                              <Button
                                className="mt-4 w-full text-xs font-mono"
                                variant="outline"
                                disabled={
                                  !exerciseDay.routines.every(
                                    (_, routineIndex) =>
                                      rpeInputs?.[
                                        `${exerciseDay.day}-${routineIndex}`
                                      ]?.trim()
                                  )
                                }
                                onClick={async () => {
                                  if (!currentPlan) return;

                                  const routines = exerciseDay.routines;
                                  for (let i = 0; i < routines.length; i++) {
                                    const key = `${exerciseDay.day}-${i}`;
                                    const rpe = Number(rpeInputs[key]);
                                    if (!rpe || isNaN(rpe)) continue;
                                    try {
                                      await updateRpe({
                                        planId: currentPlan._id,
                                        day: exerciseDay.day,
                                        routineIndex: i,
                                        rpe,
                                      });
                                    } catch (err) {
                                      console.error(err);
                                      toast.error("Failed to update RPE");
                                      return;
                                    }
                                  }

                                  toast.success(
                                    `RPE saved for ${exerciseDay.day}`
                                  );
                                  setSubmittedDays((prev) =>
                                    new Set(prev).add(exerciseDay.day)
                                  );
                                }}
                              >
                                Submit
                              </Button>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      )}
                    </Accordion>
                  </div>
                </TabsContent>

                <TabsContent value="diet">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-sm text-muted-foreground">
                        DAILY CALORIE TARGET
                      </span>
                      <div className="font-mono text-xl text-primary">
                        {currentPlan.dietPlan.dailyCalories} KCAL
                      </div>
                    </div>
                    <div className="h-px w-full bg-border my-4"></div>
                    <div className="space-y-4">
                      {currentPlan.dietPlan.meals.map((meal, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg overflow-hidden p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <h4 className="font-mono text-primary">
                              {meal.name}
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {meal.foods.map((food, foodIndex) => (
                              <li
                                key={foodIndex}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <span className="text-xs text-primary font-mono">
                                  {String(foodIndex + 1).padStart(2, "0")}
                                </span>
                                <span>
                                  {food.name} – {food.grams}g – {food.protein}g
                                  protein
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <GenerateButton
            currentPlan={currentPlan}
            submittedDays={submittedDays}
            allPlans={allPlans}
            onNewPlan={handleNewPlan}
            rpeInputs={rpeInputs}
            disabled={!allDaysSubmitted}
          />
        </div>
      ) : (
        <NoFitnessPlan />
      )}
    </section>
  );
};

export default ProfilePage;
