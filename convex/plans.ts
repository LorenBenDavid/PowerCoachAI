import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    gender: v.optional(v.string()),
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              working_weights: v.number(),
              name: v.string(),
              sets: v.number(),
              reps: v.number(),
              rpe: v.optional(v.number()),
            })
          ),
        })
      ),
    }),

    // כאן אנחנו מוסיפים את השדות החדשים
    newWorkoutPlan: v.optional(v.array(v.string())), // שמות תרגילים חדשים שהוזנו
    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(
            v.object({
              name: v.string(),
              grams: v.number(),
              protein: v.number(),
            })
          ),
        })
      ),
    }),

    newDietPlan: v.optional(v.array(v.string())), // שמות מזון חדשים שהוזנו
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // בדוק אם יש תכניות פעילות פעילה והפוך אותן לבלתי פעילויות
    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const plan of activePlans) {
      await ctx.db.patch(plan._id, { isActive: false });
    }

    // הכנס את התוכנית החדשה עם העמודות החדשות
    const planId = await ctx.db.insert("plans", args);

    return planId;
  },
});

export const getUserPlans = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return plans;
  },
});

export const updateRpeForRoutine = mutation({
  args: {
    planId: v.id("plans"),
    day: v.string(),
    routineIndex: v.number(),
    rpe: v.number(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    const updatedExercises = plan.workoutPlan.exercises.map((exercise) => {
      if (exercise.day !== args.day) return exercise;

      const updatedRoutines = [...exercise.routines];
      if (!updatedRoutines[args.routineIndex]) return exercise;

      updatedRoutines[args.routineIndex] = Object.assign(
        {},
        updatedRoutines[args.routineIndex],
        { rpe: args.rpe }
      );

      return {
        ...exercise,
        routines: updatedRoutines,
      };
    });

    await ctx.db.patch(args.planId, {
      workoutPlan: {
        ...plan.workoutPlan,
        exercises: updatedExercises,
      },
    });
  },
});

export const getPlanById = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    return plan;
  },
});
export const deleteAllBadPlans = mutation(async (ctx) => {
  const plans = await ctx.db.query("plans").collect();

  for (const plan of plans) {
    try {
      const foods = plan.dietPlan?.meals?.[0]?.foods;
      if (!Array.isArray(foods)) continue;

      for (const food of foods) {
        if (
          typeof food !== "object" ||
          !food.name ||
          !food.grams ||
          !food.protein
        ) {
          await ctx.db.delete(plan._id);
          break;
        }
      }
    } catch {
      await ctx.db.delete(plan._id);
    }
  }
});
export const saveUserFeedback = mutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal("exercise"), v.literal("food")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const activePlan = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!activePlan) throw new Error("No active plan found");

    const update: any = {};
    if (args.type === "exercise") update.newWorkoutPlan = [args.text];
    else update.newDietPlan = [args.text];

    await ctx.db.patch(activePlan._id, update);
  },
});
export const deleteAllUserPlans = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }

    return true;
  },
});
export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.planId);
  },
});
