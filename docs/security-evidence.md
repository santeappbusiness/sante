## Security evidence 

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

## Secrets: not in the browser bundle
now the above thingy proves that dangerous keys never reached the visitor's browser.
now the OPEN AI KEY and Service role key both are named without any sus prefix aka public, 
so next.js keeps them server-side.
we searched the live page source for the word service_role and got FALSE which means it isnt there. 
now the question arises why it matters ? 
the service role key ignores EVERY RLS rule and we just proved it works . now if it get leaked
into the browser all of the above will be meaningless
## Safety gate: fails closed (worth adding it's today's win)
This proves a red flag genuinely stops a session, and stops it safely.
On the live site, ticking chest pain gives the pause screen and no workout.
A blocked result now carries zero minutes and zero movements, so if any future code forgets to check the flag,
it produces an error not a quiet little session for someone who reported chest pain.
 Known open item
- /api/adapt does not yet require a bearer token, so the per-profile database
  rate limit does not cover unauthenticated callers. Fix agreed in principle,
  queued behind coordination with the route owner

## AI validation : out-of-schema output is rejected

Now this is about not trusting what luna actually sends back for that to happen, we made sure that the model returns a plan , but our code will treat is basically as a suspect until it passed two fundamentally important checks which are : 
Shape check aka Zod basically this check checks if the format is right by format being right we mean the right fields , right types and if not ? it will throw it out.
Rules check aka Violations , now this check if the shape is right, does the content of the data obey today's limits?  it will rejects the plan if it contains the movement that was not on the allowed list or uses more movements than allowed is it too intense? or runs too long ,stuff like that . 

So if either of the check failed? ask the model once more if it fails again then use the safe backup plan instead.
now comes the strongest part : 
the final movements are not taken from the model's words at all , the model runs ids like mv_walk, and our code looks each ids up in our own catalogue and rebuild the movement from there . So even if the model tried to invent a movement or rewrites the instructions it legit cannot so thats what makes the model true by construction , not hope. 

## Errors: failures fall back without leaking
now this part is about what happens when things break . The model can time out , the network can drop . the key aka API could go missing or the output fail the validation twice. in every one of those cases the user will get either a proper backup plan or an honest answer aka "something went wrong" 
now you all must be wondering why does this part even matters? 
it basically proves that the app will work even if AI switched off. Safety and a usable session dont depends on the model answering and thats basically the whole crux of the product. 

The honest part we are going to include is : 

the backup plan sometimes says "we shortened today's session " even on days its not kinda awkward and a very restrictive profile can sometimes produce a plan with zero movements , we wrote those down openly and labelled them clearly that those and copy and edge case bugs not some error-leak bugs. no error details reaches the user either way . so we are honestly still claming that " failure dont leak" .

## Dependency audit
npm flagged one critical in Next (middleware auth-bypass, CVE-2025-29927). Not reachable — no middleware in the codebase, and authorisation is enforced in Postgres RLS and column grants, not at the edge. Reachable risk limited to RSC denial-of-service (availability only, behind Vercel). Pinned deliberately on 14.2 for judging; major upgrade deferred.
