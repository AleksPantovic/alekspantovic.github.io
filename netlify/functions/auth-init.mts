export async function handler(event: any) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Auth-init function executed successfully!" }),
  };
}
