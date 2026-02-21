"use client";

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button 
      type="submit"
  onClick={() => console.log('submitted')}
>
      Save Changes
    </Button>
  );
}

