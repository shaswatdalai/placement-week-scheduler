import Interview from "../models/interview.model";


export interface IExplanation {
    interviewId: string;
    studentId: string;
    companyId: string;
    status: string;
    reasonTrace: string[];
    summary: string;
    aiSummary?: string;
}

function buildDeterministicSummary(
    interviewId: string,
    status: string,
    reasonTrace: string[]
): string {
    if (reasonTrace.length === 0) {
        return `Interview ${interviewId} has status '${status}'. No reason trace is available.`;
    }

    // last entry usually has the final verdict
    const final = reasonTrace[reasonTrace.length - 1];

    if (status === "scheduled") {
        return (
            `Interview ${interviewId} was successfully scheduled. ` +
            `The scheduler evaluated ${reasonTrace.length} step(s). ` +
            `Final decision: ${final}.`
        );
    }

    if (status === "unscheduled" || status === "cancelled") {
        const rejections = reasonTrace.filter(
            (t) => t.includes("Rejected") || t.includes("UNSCHEDULED")
        );
        const rejectionSummary =
            rejections.length > 0
                ? ` Rejected windows: ${rejections.join("; ")}.`
                : "";
        return (
            `Interview ${interviewId} could not be scheduled. ` +
            `Outcome: ${final}.` +
            rejectionSummary
        );
    }

    return `Interview ${interviewId} — status: ${status}. Latest trace: ${final}.`;
}


async function buildAiSummary(
    interviewId: string,
    status: string,
    reasonTrace: string[],
    companyId: string,
    studentId: string
): Promise<string | undefined> {

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return undefined;

    try {
        const policyContext = `
You are an assistant that explains placement scheduling decisions to a placement coordinator.
The scheduler is FULLY DETERMINISTIC — it follows these rules:
1. Higher-priority companies (lower priority number) are scheduled first.
2. Student CGPA must meet the company minimum.
3. Student branch must be in the company's eligible branches list.
4. No student, panel, or room can have two interviews at the same time.
5. Interview duration must fit in the selected time window.
6. During replanning, only directly affected interviews are moved (minimum disturbance).
You MUST NOT suggest any alternative scheduling decisions. Just explain the trace provided.`;

        const userPrompt = `
Interview ID: ${interviewId}
Student: ${studentId}
Company: ${companyId}
Status: ${status}

Reason trace (in order):
${reasonTrace.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Please write a single clear paragraph (2–4 sentences) explaining why the scheduler
reached this outcome. Use the trace steps as your source of truth.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: policyContext },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 200,
                temperature: 0
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn(`Groq API responded with status ${response.status}: ${errText}`);
            return undefined;
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content?.trim();
    } catch (err) {
        console.warn("Groq explanation failed:", err);
        return undefined;
    }
}


export async function explainInterview(interviewId: string): Promise<IExplanation> {

    const interview = await Interview.findOne({ interviewId });

    if (!interview) {
        throw new Error(`Interview ${interviewId} not found`);
    }

    const trace = interview.reasonTrace ?? [];

    const summary = buildDeterministicSummary(
        interviewId,
        interview.status,
        trace
    );

    const aiSummary = await buildAiSummary(
        interviewId,
        interview.status,
        trace,
        interview.companyId,
        interview.studentId
    );

    return {
        interviewId: interview.interviewId,
        studentId: interview.studentId,
        companyId: interview.companyId,
        status: interview.status,
        reasonTrace: trace,
        summary,
        ...(aiSummary ? { aiSummary } : {})
    };
}
