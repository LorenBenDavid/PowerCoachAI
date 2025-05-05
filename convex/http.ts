import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const http = httpRouter();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Webhook route to handle Clerk events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, first_name, last_name, image_url, email_addresses } =
        evt.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.syncUser, {
          email,
          name,
          image: image_url,
          clerkId: id,
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.updateUser, {
          clerkId: id,
          email,
          name,
          image: image_url,
        });
      } catch (error) {
        console.log("Error updating user:", error);
        return new Response("Error updating user", { status: 500 });
      }
    }

    return new Response("Webhooks processed successfully", { status: 200 });
  }),
});

// Validate workout plan to ensure it has proper numeric types
function validateWorkoutPlan(plan: any) {
  const validatedPlan = {
    schedule: plan.schedule,
    exercises: plan.exercises.map((exercise: any) => ({
      day: exercise.day,
      routines: exercise.routines.map((routine: any) => ({
        name: routine.name,
        sets:
          typeof routine.sets === "number"
            ? routine.sets
            : parseInt(routine.sets) || 1,
        reps:
          typeof routine.reps === "number"
            ? routine.reps
            : parseInt(routine.reps) || 10,
        working_weights:
          typeof routine.working_weights === "number"
            ? routine.working_weights
            : parseInt(routine.working_weights) || 40,
      })),
    })),
  };
  return validatedPlan;
}

// Validate diet plan to ensure it strictly follows schema
function validateDietPlan(plan: any) {
  if (!Array.isArray(plan.meals))
    throw new Error("meals missing or not an array");

  return {
    dailyCalories: Number(plan.dailyCalories),
    meals: plan.meals.map((meal: any) => ({
      name: String(meal.name),
      foods: meal.foods.map((food: any) => {
        if (
          typeof food === "object" &&
          "name" in food &&
          "grams" in food &&
          "protein" in food
        ) {
          return {
            name: String(food.name),
            grams: Number(food.grams),
            protein: Number(food.protein),
          };
        } else {
          throw new Error(
            "Invalid food format. Must be {name, grams, protein}"
          );
        }
      }),
    })),
  };
}
function validateNewWorkoutPlan(input: any): string[] {
  if (!input) return [];
  if (!Array.isArray(input)) throw new Error("newWorkoutPlan must be an array");
  for (const item of input) {
    if (typeof item !== "string") {
      throw new Error("newWorkoutPlan items must be strings");
    }
  }
  return input;
}
function validateNewDietPlan(input: any): string[] {
  if (!input) return [];
  if (!Array.isArray(input)) throw new Error("newDietPlan must be an array");
  for (const item of input) {
    if (typeof item !== "string") {
      throw new Error("newDietPlan items must be strings");
    }
  }
  return input;
}

http.route({
  path: "/vapi/generate-program",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log("🔥 generate-program endpoint hit");

    try {
      const payload = await request.json();

      const {
        user_id,
        age,
        height,
        weight,
        injuries,
        workout_days,
        fitness_goal,
        fitness_level,
        dietary_restrictions,
        gender,
        previousPlanId,
        newDietPlan,
        newWorkoutPlan,
      } = payload;

      let previousPlan = null;
      if (previousPlanId) {
        previousPlan = await ctx.runQuery(api.plans.getPlanById, {
          planId: previousPlanId,
        });
      }

      console.log("Payload is here:", payload);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.4, // lower temperature for more predictable outputs
          topP: 0.9,
          responseMimeType: "application/json",
        },
      });

      const workoutPrompt = `You are an elite AI powerlifting coach.

Your job is to generate a progressive overload powerlifting training plan for WEEK {X} of a training block.  
The user already completed WEEK {X−1} and submitted RPE values per exercise.  
Your goal is to create a more optimized and personalized plan, adjusting difficulty based on actual RPE feedback.

--- USER INFO ---
Age: ${age}
Height: ${height}
Weight: ${weight}
Gender: ${gender}
Injuries or limitations: ${injuries}
Experience level: ${fitness_level}
Goal: ${fitness_goal}
Days available: ${workout_days}

--- USER CHANGE REQUESTS ---
${
  previousPlan?.newWorkoutPlan?.length
    ? `
• The user requested to replace the following exercises: ${previousPlan.newWorkoutPlan.join(", ")}.
→ Replace each with a relevant alternative that trains the same muscle group or function.
→ Ensure no exercise from this list appears in the new plan.
`
    : ""
}

--- PREVIOUS PLAN DATA (RPE + Weights) ---
${previousPlan ? JSON.stringify(previousPlan.workoutPlan) : "N/A"}

--- TRAINING STRATEGY RULES ---
- Week 1 should be light.
- From Week 2 and beyond, adjust **working_weights** based on the user's RPE per routine:
  • RPE > 9 → reduce weight and/or lower volume (too hard)
  • RPE 7–8 → small increase (optimal)
  • RPE < 6 → very slight increase
- Weekly progress in weights must be **very mild**, no drastic jumps.
- Do not increase working_weights by more than 1–2% per week.
- Do not assume users improve quickly – progression should be conservative.
- If an exercise had a very high RPE, reduce load next week.
- Adjust sets/reps and weight accordingly.
- Prevent overtraining. Avoid injury and fatigue.

--- TECHNICAL RULES ---
- Only use these core lifts: Squat, Bench Press, Deadlift
- Each core lift must appear at least once per week.
- Do not repeat the same exercise within a single day.
- Each training day must include at least 4 distinct exercises
- Add accessory lifts that support the core lifts.
- Use only numeric values (no strings).
- Do not add fields beyond those specified.

--- FORMAT (MUST FOLLOW EXACTLY) ---
Return valid JSON:
{
  "schedule": ["Monday", "Wednesday", "Friday"],
  "exercises": [
    {
      "day": "Monday",
      "routines": [
        {
          "name": "Squat",
          "sets": 4,
          "reps": 5,
          "working_weights": 100
        },
        {
          "name": "Hamstring Curls",
          "sets": 3,
          "reps": 12,
          "working_weights": 35
        }
      ]
    }
  ]
}`;

      const workoutResult = await model.generateContent(workoutPrompt);
      const workoutPlanText = workoutResult.response.text();
      let workoutPlan;

      try {
        workoutPlan = JSON.parse(workoutPlanText);
        workoutPlan = validateWorkoutPlan(workoutPlan);
      } catch (err) {
        console.error("Failed to parse workoutPlanText:", workoutPlanText);
        throw new Error("Invalid workout plan format from AI");
      }

      const dietPrompt = `You are an experienced AI nutrition coach.

      Your job is to generate a **personalized weekly diet plan** that supports the user's powerlifting goal, recovery, and muscle growth.
      
      --- USER INFO ---
      Age: ${age}
      Height: ${height}
      Weight: ${weight}
      Gender: ${gender}
      Fitness goal: ${fitness_goal}
      Dietary restrictions: ${dietary_restrictions}
      
      --- USER REQUESTS (FOOD CHANGES) ---
      Current requested changes: ${JSON.stringify(newDietPlan)}
      ${previousPlan?.newDietPlan?.length ? `Previous plan change requests: ${previousPlan.newDietPlan.join(", ")}` : ""}
      
      → If any of the above arrays are **not empty**:
      • Treat each item as a food the user wants to REMOVE from the diet.
      • Replace it with a different food with similar **protein** and **nutritional value**.
      • The replacement must comply with the user's dietary restrictions and support the same function in the meal.
      • Do NOT include the removed items anywhere in the new plan.
      
      --- NUTRITION STRATEGY RULES ---
      - Estimate daily calorie target based on user details and goal.
      - Ensure daily **protein intake** is between **1.8–2.2g per kg of body weight**.
      - Include at least **3 main meals**: Breakfast, Lunch, Dinner.
      - Optionally include 1–2 **snack meals** (e.g., pre/post workout, evening snack).
      - Meals should be balanced, rich in protein, and support muscle recovery.
      - Avoid processed foods, keep it clean and performance-oriented.
      
      --- FORMAT RULES (STRICT) ---
      - Only return valid JSON (no extra text, markdown, comments).
      - Structure must match EXACTLY:
      {
        "dailyCalories": 2500,
        "meals": [
          {
            "name": "Breakfast",
            "foods": [
              { "name": "Oatmeal", "grams": 80, "protein": 10 },
              { "name": "Eggs", "grams": 120, "protein": 12 }
            ]
          },
          ...
        ]
      }
      - Each food must be an object: { name, grams, protein }
      - Do NOT add any other keys (no fat, carbs, etc.)
      - Output must be parseable JSON and follow this format precisely.`;

      const dietResult = await model.generateContent(dietPrompt);
      const dietPlanText = dietResult.response.text();
      let dietPlan;

      try {
        dietPlan = JSON.parse(dietPlanText);
        let parsed;
        try {
          parsed = JSON.parse(dietPlanText);
        } catch (e) {
          throw new Error(
            "❌ Failed to parse Gemini diet JSON:\n" + dietPlanText
          );
        }

        if (!parsed.meals?.[0]?.foods?.[0]?.name) {
          console.error(
            "❌ Gemini did not return correct diet structure:\n",
            parsed
          );
          throw new Error(
            "Gemini diet plan missing food details. Fix your prompt."
          );
        }

        dietPlan = validateDietPlan(parsed);
      } catch (err) {
        console.error("Failed to parse dietPlanText:", dietPlanText);
        throw new Error("Invalid diet plan format from AI");
      }

      // Save to our DB: CONVEX
      const planId = await ctx.runMutation(api.plans.createPlan, {
        userId: user_id,
        dietPlan,
        newDietPlan: validateNewDietPlan(payload.newDietPlan),
        newWorkoutPlan: validateNewWorkoutPlan(payload.newWorkoutPlan),
        workoutPlan,
        isActive: true,
        name: `${fitness_goal} Plan - ${new Date().toLocaleDateString()}`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            planId,
            workoutPlan,
            dietPlan,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error generating fitness plan:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
