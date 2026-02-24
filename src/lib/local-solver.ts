import { evaluate, derivative } from 'mathjs';

/**
 * A robust local mathematical solver that works offline.
 * It uses mathjs to handle a wide range of mathematical operations.
 */
export async function localSolve(equation: string): Promise<{ stepByStepSolution: string; finalAnswer: string }> {
  try {
    // Normalization: Treat Unicode superscripts as standard carats
    let input = equation.trim().toLowerCase()
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4');

    // 1. Handle derivative requests (e.g., "derivative of x^2")
    if (input.includes('derivative') || input.includes('diff')) {
      const expr = input.replace(/derivative of|derivative|diff/g, '').trim();
      const result = derivative(expr, 'x');
      return {
        stepByStepSolution: `1. Identified derivative operation.\n2. Function: ${expr}\n3. Applied power/chain rules locally.`,
        finalAnswer: `d/dx = ${result.toString().replace(/\^2/g, '²')}`,
      };
    }

    // 2. Handle standard evaluation
    let expression = input.replace('=', '').trim();
    
    const result = evaluate(expression);
    
    let finalAnswer = typeof result === 'number' ? result.toLocaleString() : result.toString();
    
    // Convert output back to nice symbols if possible
    finalAnswer = finalAnswer.replace(/\^2/g, '²').replace(/\^3/g, '³');
    
    return {
      stepByStepSolution: `1. Input recognized as a mathematical expression: ${expression}\n2. Processed using local mathematical engine.\n3. Note: Symbolic "solve for x" and word problems require AI (Online Mode).`,
      finalAnswer: finalAnswer,
    };
  } catch (error: any) {
    console.error("Local Solver Error:", error);
    throw new Error("Local engine couldn't solve this. Try a standard math expression (e.g., 'cos(45) * 2') or connect to the internet for AI Word Problem solving.");
  }
}
