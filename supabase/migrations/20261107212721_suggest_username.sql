-- Function to generate a suggested username from a silly adjective + boring noun
create or replace function public.suggest_username(p_separator text default '')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_adjectives text[] := array[
    'derpy', 'pickled', 'feral', 'wonky', 'funky', 'chonky', 'squeaky', 'zesty',
    'wiggly', 'goofy', 'clumsy', 'sassy', 'cranky', 'dizzy', 'fuzzy', 'snoozy',
    'crusty', 'rusty', 'wacky', 'soggy', 'crispy', 'loopy', 'nutty', 'quirky',
    'sleepy', 'spooky', 'cheeky', 'groovy', 'jumpy', 'bouncy', 'flabby', 'muddy',
    'mushy', 'noisy', 'rowdy', 'shifty', 'sticky', 'sweaty', 'twitchy', 'zippy',
    'blurry', 'grumpy', 'sneaky', 'chunky', 'greasy', 'peppy', 'plucky', 'bubbly',
    'jittery', 'dorky', 'breezy', 'snappy', 'fluffy', 'mossy', 'foggy', 'dusty',
    'salty', 'slimy', 'gummy', 'pudgy', 'stubby', 'wobbly', 'clueless', 'crinkly',
    'drowsy', 'frantic', 'fumbly', 'gassy', 'geeky', 'giggly', 'glitchy', 'gloomy',
    'gullible', 'hyper', 'itchy', 'lazy', 'moldy', 'musty', 'nerdy', 'nippy',
    'patchy', 'pesky', 'prickly', 'puffy', 'ratty', 'scruffy', 'shaky', 'sloppy',
    'sluggish', 'smelly', 'snarky', 'snoopy', 'spongy', 'stormy', 'sulky', 'tipsy',
    'touchy', 'tubby', 'twisty', 'uneven', 'vague', 'weepy', 'whiny', 'woozy', 'yappy'
  ];
  v_nouns text[] := array[
    'toaster', 'stapler', 'sponge', 'spatula', 'napkin', 'blender', 'pencil', 'eraser',
    'binder', 'folder', 'bucket', 'kettle', 'teapot', 'thermos', 'teacup', 'coaster',
    'ruler', 'spoon', 'fork', 'whisk', 'doorknob', 'mop', 'broom', 'dustpan',
    'mailbox', 'pillow', 'blanket', 'towel', 'saucer', 'remote', 'socket', 'lanyard',
    'cabinet', 'drawer', 'carpet', 'cushion', 'mattress', 'radiator', 'envelope', 'calendar',
    'notebook', 'charger', 'adapter', 'mousepad', 'keyboard', 'speaker', 'monitor', 'colander',
    'funnel', 'grater', 'peeler', 'ladle', 'tongs', 'skillet', 'pitcher', 'hanger',
    'shoelace', 'button', 'zipper', 'paperclip', 'thumbtack', 'scissors', 'lamp', 'lightbulb',
    'battery', 'faucet', 'plunger', 'cardboard', 'curtain', 'footrest', 'dustcloth', 'clipboard',
    'dustbin', 'doorstop', 'washcloth', 'manila', 'notepad', 'postit', 'pushpin', 'board',
    'desk', 'chair', 'table', 'shelf', 'stool', 'bench', 'crate', 'carton', 'barrel',
    'basin', 'cart', 'tray', 'pan', 'pot', 'cup', 'mug', 'plate', 'bowl', 'dish',
    'jar', 'bottle', 'can', 'tin', 'jug', 'tub', 'box'
  ];
  v_sep text := '';
  v_adj text;
  v_noun text;
  v_candidate text;
  v_base text;
  v_attempts int := 0;
begin
  if p_separator in ('_', '.') then
    v_sep := p_separator;
  end if;

  loop
    v_attempts := v_attempts + 1;

    v_adj := v_adjectives[1 + floor(random() * array_length(v_adjectives, 1))::int];
    v_noun := v_nouns[1 + floor(random() * array_length(v_nouns, 1))::int];
    v_base := v_adj || v_sep || v_noun;

    if v_attempts <= 10 then
      v_candidate := v_base;
    else
      -- Append 2 random digits if first 10 random combinations collide
      v_candidate := substring(v_base from 1 for 18) || (10 + floor(random() * 90))::text;
    end if;

    -- Ensure length is at most 20 characters
    if length(v_candidate) > 20 then
      v_candidate := substring(v_candidate from 1 for 20);
    end if;

    -- Check availability
    if not exists (
      select 1
      from public.profiles
      where lower(username) = lower(v_candidate)
    ) then
      return v_candidate;
    end if;

    -- Safety breakout after 50 attempts
    if v_attempts >= 50 then
      v_candidate := substring(v_base from 1 for 15) || (10000 + floor(random() * 90000))::text;
      return substring(v_candidate from 1 for 20);
    end if;
  end loop;
end;
$$;

grant execute on function public.suggest_username(text) to anon, authenticated;
