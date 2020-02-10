module.exports = async function logout(ctx, next) {
  const token = ctx.request.body.token;
  await ctx.logout(token);
  ctx.body = "ok";
  next();
};
