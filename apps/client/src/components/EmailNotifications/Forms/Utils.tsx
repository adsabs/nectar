export const isValidKeyword = (keyword: string) => {
  // make sure parenthesis are balanced
  const stack = [];
  for (let i = 0; i < keyword.length; i++) {
    const ch = keyword[i];
    if (['(', '[', '{'].includes(ch)) {
      stack.push(ch);
    } else if ([')', ']', '}'].includes(ch)) {
      if (stack.length === 0) {
        return false;
      }
      if (ch === ')' && stack.pop() !== '(') {
        return false;
      }
      if (ch === ']' && stack.pop() !== '[') {
        return false;
      }
      if (ch === '{' && stack.pop() !== '}') {
        return false;
      }
    }
  }

  return stack.length === 0;
};
