
# Solves a literal equation for a specific variable.

const Tokenizer = preload("res://solvers/utils/tokenizer.gd").Tokenizer
const Parser = preload("res://solvers/utils/parser.gd").Parser
const EquationNode = preload("res://solvers/utils/parser.gd").EquationNode
const BinaryOpNode = preload("res://solvers/utils/parser.gd").BinaryOpNode
const UnaryOpNode = preload("res://solvers/utils/parser.gd").UnaryOpNode
const VariableNode = preload("res://solvers/utils/parser.gd").VariableNode
const NumberNode = preload("res://solvers/utils/parser.gd").NumberNode
const Token = preload("res://solvers/utils/token.gd").Token

# Main entry point to solve a literal equation.
static func solve(equation_string: String, target_variable: String) -> Dictionary:
	var steps = ["*   **Step 1:** Original Equation: `%s`" % equation_string]

	var tokenizer = Tokenizer.new(equation_string)
	var tokens = tokenizer.tokenize()
	var parser = Parser.new(tokens)
	var ast = parser.parse()

	if not ast is EquationNode:
		return {"error": "Invalid equation provided to LiteralSolver."}
	
	if not _node_contains_variable(ast, target_variable):
		return {"error": "The variable '" + target_variable + "' was not found in the equation."}

	var result = _isolate_variable(ast, target_variable, steps)
	
	return result


# --- Core Logic ---

static func _isolate_variable(node: EquationNode, var_name: String, steps: Array) -> Dictionary:
	var current_node = node
	var step_counter = 2

	# Ensure the variable is on the left side.
	var side_containing_var = _get_side_containing_variable(current_node, var_name)
	if side_containing_var == current_node.right:
		var temp = current_node.left
		current_node.left = current_node.right
		current_node.right = temp
		steps.append("*   **Step %d:** Swap sides to bring the variable term to the left: `%s`" % [step_counter, _ast_to_string(current_node)])
		step_counter += 1

	# Loop until only the target variable is on the left side
	while not (_is_target_variable(current_node.left, var_name)):

		var step_description = ""

		# Handle unary minus, e.g., -x = a  => x = -a
		if current_node.left is UnaryOpNode and current_node.left.op_token.type == Token.Type.MINUS:
			step_description = "Multiply both sides by -1 to make the variable positive."
			current_node.left = current_node.left.node
			# Apply negation to the right side
			if current_node.right is NumberNode:
				current_node.right.token.value = -current_node.right.token.value
			else:
				current_node.right = UnaryOpNode.new(Token.new(Token.Type.MINUS, "-"), current_node.right)

		elif current_node.left is BinaryOpNode:
			var binex_node = current_node.left
			var op = binex_node.op_token.type
			var left_child = binex_node.left
			var right_child = binex_node.right

			# Decide which child to move based on which one contains the variable.
			if _node_contains_variable(left_child, var_name):
				# Variable is in the left child, so move the right child.
				var inverse_op = _get_inverse_op(op)
				step_description = _get_operation_description(op, right_child, false)
				current_node.right = BinaryOpNode.new(current_node.right, Token.new(inverse_op, ""), right_child)
				current_node.left = left_child
			
elif _node_contains_variable(right_child, var_name):
				# The variable is in the right child.
				if op == Token.Type.PLUS or op == Token.Type.MULTIPLY:
					var inverse_op = _get_inverse_op(op)
					step_description = _get_operation_description(op, left_child, false)
					current_node.right = BinaryOpNode.new(current_node.right, Token.new(inverse_op, ""), left_child)
					current_node.left = right_child
				elif op == Token.Type.MINUS: # a - x = b  =>  a - b = x
					step_description = "Rearrange the subtraction to isolate the variable."
					current_node.right = BinaryOpNode.new(left_child, Token.new(Token.Type.MINUS, "-"), current_node.right)
					current_node.left = right_child
				elif op == Token.Type.DIVIDE: # a / x = b => a / b = x
					step_description = "Rearrange the division to isolate the variable."
					current_node.right = BinaryOpNode.new(left_child, Token.new(Token.Type.DIVIDE, "/"), current_node.right)
					current_node.left = right_child
				else:
					return {"error": "Unsupported operator in literal equation.", "steps": steps}
			else:
				# This case should ideally not be reached if the top-level checks are correct.
				return {"error": "Variable disappeared during solving process.", "steps": steps}
		else:
			return {"error": "Cannot solve for a variable within a complex expression like parentheses.", "steps": steps}

		steps.append("*   **Step %d:** %s: `%s`" % [step_counter, step_description, _ast_to_string(current_node)])
		step_counter += 1

	var solution_string = _ast_to_string(current_node.right)
	steps.append("*   **Final Answer:** `%s = %s`" % [var_name, solution_string])
	return {"solution": solution_string, "error": null, "steps": steps}


# --- Helper Functions ---

static func _get_operation_description(op_type: int, node, is_inverse: bool) -> String:
	var node_str = _ast_to_string(node)
	var operation = ""

	match op_type:
		Token.Type.PLUS: operation = "Subtract" if not is_inverse else "Add"
		Token.Type.MINUS: operation = "Add" if not is_inverse else "Subtract"
		Token.Type.MULTIPLY: operation = "Divide by" if not is_inverse else "Multiply by"
		Token.Type.DIVIDE: operation = "Multiply by" if not is_inverse else "Divide by"

	return "%s `%s` from both sides" % [operation, node_str]

static func _is_target_variable(node, var_name: String) -> bool:
	return node is VariableNode and node.token.value == var_name

static func _get_side_containing_variable(node: EquationNode, var_name: String):
	if _node_contains_variable(node.left, var_name):
		return node.left
	return node.right

static func _node_contains_variable(node, var_name) -> bool:
	if node == null: return false
	if _is_target_variable(node, var_name):
		return true
	if node is BinaryOpNode:
		return _node_contains_variable(node.left, var_name) or _node_contains_variable(node.right, var_name)
	if node is UnaryOpNode:
		return _node_contains_variable(node.node, var_name)
	return false

static func _get_inverse_op(op_type: int) -> int:
	match op_type:
		Token.Type.PLUS: return Token.Type.MINUS
		Token.Type.MINUS: return Token.Type.PLUS
		Token.Type.MULTIPLY: return Token.Type.DIVIDE
		Token.Type.DIVIDE: return Token.Type.MULTIPLY
	return -1

static func _ast_to_string(node) -> String:
	if node == null: return ""
	if node is NumberNode: 
		# Use the helper to avoid printing ".0"
		return preload("res://solvers/utils/helpers.gd").format_number(node.token.value)
	if node is VariableNode: return node.token.value
	if node is UnaryOpNode:
		var child_str = _ast_to_string(node.node)
		# If child is a binary op, wrap in parens, e.g. -(a+b)
		if node.node is BinaryOpNode:
			child_str = "(" + child_str + ")"
		return "-" + child_str
	if node is BinaryOpNode:
		var left_str = _ast_to_string(node.left)
		var right_str = _ast_to_string(node.right)
		var op_map = {
			Token.Type.PLUS: " + ", Token.Type.MINUS: " - ", 
			Token.Type.MULTIPLY: " * ", Token.Type.DIVIDE: " / "
		}
		var op_str = op_map.get(node.op_token.type, " ? ")
		# Add parentheses for clarity if children have lower precedence.
		if node.left is BinaryOpNode and (node.op_token.type == Token.Type.MULTIPLY or node.op_token.type == Token.Type.DIVIDE):
			 left_str = "(" + left_str + ")"
		if node.right is BinaryOpNode and (node.op_token.type == Token.Type.MULTIPLY or node.op_token.type == Token.Type.DIVIDE):
			right_str = "(" + right_str + ")"
		return left_str + op_str + right_str
	if node is EquationNode:
		return _ast_to_string(node.left) + " = " + _ast_to_string(node.right)
	return "?"
