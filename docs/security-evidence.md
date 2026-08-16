##Security evidence 

RLS aka Row level Security also known as user isolation basically it proves one user cannot see or touch 
another user data . We tested it as an attacker would from where you might wonder from the live site where 
we used only the public key anyone can pull from the browser. 
Now basically we signed in as a ananoymous user and asked the database for all the profile existing now the 
database returned zero profiles aka no profile showed even though 11 existed which gives us enough proof that RLS
was working as it refused to show us anyone else row.

for the next step , we tried to insert a check-in while setting the redflag , guess what happened it REJECTED,AKA 
403.
Then we tried to flip the flag is_demo to basically escape the demo status 
and guess what happened ? it REJECTED AGAN 403

Secrets: not in the browser bundle
now the above thingy proves that dangerous keys never reached the visitor's browser.
now the OPEN AI KEY and Service role key both are named without any sus prefix aka public, 
so next.js keeps them server-side.
we searched the live page source for the word service_role and got FALSE which means it isnt there. 
now the question arises why it matters ? 
the service role key ignores EVERY RLS rule and we just proved it works . now if it get leaked
into the browser all of the above will be meaningless
Safety gate: fails closed (worth adding it's today's win)
This proves a red flag genuinely stops a session, and stops it safely.
On the live site, ticking chest pain gives the pause screen and no workout.
A blocked result now carries zero minutes and zero movements, so if any future code forgets to check the flag,
it produces an error not a quiet little session for someone who reported chest pain.
 Known open item
- /api/adapt does not yet require a bearer token, so the per-profile database
  rate limit does not cover unauthenticated callers. Fix agreed in principle,
  queued behind coordination with the route owner
