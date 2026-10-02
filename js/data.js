/* ============================================================
   data.js - seed data for the Writers Lab Online prototype
   All dates are generated relative to "today" so the demo
   always looks current.
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';

  // Fixed clock reference for the session so relative dates stay stable
  var T0 = Date.now();
  WL.now = function () { return Date.now(); };

  function ago(days, hours) {
    return new Date(T0 - (days || 0) * 86400000 - (hours || 0) * 3600000).toISOString();
  }
  function ahead(days) {
    return new Date(T0 + (days || 0) * 86400000).toISOString();
  }

  // End of the current school year (June 5 of the next occurring year)
  function endOfSchoolYear() {
    var d = new Date(T0);
    var y = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
    return new Date(y, 5, 5, 23, 59).toISOString();
  }

  WL.ROLES = {
    student: { key: 'student', label: 'Student', short: 'Student', rank: 1, color: 'grey' },
    reviewer: { key: 'reviewer', label: 'Peer Reviewer', short: 'Reviewer', rank: 2, color: 'cyan' },
    officer_admin: { key: 'officer_admin', label: 'Officer Administrator', short: 'Officer Admin', rank: 3, color: 'purple' },
    teacher_advisor: { key: 'teacher_advisor', label: 'Teacher Advisor', short: 'Advisor', rank: 4, color: 'gold' }
  };

  WL.STATUS = {
    pending: { label: 'Pending Review', color: 'gold' },
    flagged: { label: 'Flagged', color: 'red' },
    approved: { label: 'Approved', color: 'green' },
    denied: { label: 'Denied', color: 'red' },
    changes_requested: { label: 'Changes Requested', color: 'volcano' },
    withdrawn: { label: 'Withdrawn', color: 'grey' }
  };

  WL.GENRES = [
    'Personal Essay', 'Argumentative Essay', 'Literary Analysis', 'Short Fiction',
    'Poetry', 'College Application Essay', 'Research Paper', 'Creative Nonfiction',
    'Journalism', 'Speech / Oratory'
  ];

  WL.FEEDBACK_FOCUS = [
    'Structure and organization', 'Grammar and mechanics', 'Argument strength',
    'Voice and style', 'Evidence and citation', 'General impressions'
  ];

  /* ---------------- Users ---------------- */

  WL.SEED_USERS = [
    {
      id: 'u_student', displayName: 'Maya Chen', email: 'chenma27@student.hse.k12.in.us',
      role: 'student', gradeLevel: 11, reviewerStatus: 'none', roleExpiresAt: null,
      createdAt: ago(214), lastActiveAt: ago(0, 2), suspendedAt: null,
      demoAccount: true,
      demoBlurb: 'Submits work, browses approved pieces, replies to feedback on their own writing. Cannot comment on other students’ work.'
    },
    {
      id: 'u_reviewer', displayName: 'Devon Brooks', email: 'brookde14@student.hse.k12.in.us',
      role: 'reviewer', gradeLevel: 12, reviewerStatus: 'approved', reviewerSince: ago(158),
      roleExpiresAt: endOfSchoolYear(), createdAt: ago(402), lastActiveAt: ago(0, 6), suspendedAt: null,
      demoAccount: true,
      demoBlurb: 'Everything a student can do, plus leaving feedback on any approved submission and working the needs-review queue.'
    },
    {
      id: 'u_officer', displayName: 'Priya Raman', email: 'ramanpr09@student.hse.k12.in.us',
      role: 'officer_admin', gradeLevel: 12, reviewerStatus: 'approved', reviewerSince: ago(390),
      roleExpiresAt: endOfSchoolYear(), createdAt: ago(742), lastActiveAt: ago(0, 1), suspendedAt: null,
      demoAccount: true,
      demoBlurb: 'NEHS officer. Runs the moderation queue, reviewer applications, comment reports, accounts and the audit log.'
    },
    {
      id: 'u_teacher', displayName: 'Ms. Ellen Hartley', email: 'ehartley@hse.k12.in.us',
      role: 'teacher_advisor', gradeLevel: null, reviewerStatus: 'approved',
      roleExpiresAt: null, isPrimaryAdvisor: true, createdAt: ago(760), lastActiveAt: ago(1, 3), suspendedAt: null,
      demoAccount: true,
      demoBlurb: 'Primary faculty advisor. Full authority: can always de-anonymize authors, grant or revoke officer status, and transfer the advisor role.'
    },

    /* --- background accounts (not switchable, populate the console) --- */
    { id: 'u_05', displayName: 'Jordan Ellis', email: 'ellisjo31@student.hse.k12.in.us', role: 'reviewer', gradeLevel: 12, reviewerStatus: 'approved', reviewerSince: ago(120), roleExpiresAt: endOfSchoolYear(), createdAt: ago(388), lastActiveAt: ago(2), suspendedAt: null },
    { id: 'u_06', displayName: 'Sofia Marquez', email: 'marqueso5@student.hse.k12.in.us', role: 'reviewer', gradeLevel: 11, reviewerStatus: 'approved', reviewerSince: ago(96), roleExpiresAt: endOfSchoolYear(), createdAt: ago(300), lastActiveAt: ago(6), suspendedAt: null },
    { id: 'u_07', displayName: 'Aaron Whitfield', email: 'whitfiaa2@student.hse.k12.in.us', role: 'student', gradeLevel: 10, reviewerStatus: 'pending', roleExpiresAt: null, createdAt: ago(64), lastActiveAt: ago(1), suspendedAt: null },
    { id: 'u_08', displayName: 'Lena Petrov', email: 'petrovle8@student.hse.k12.in.us', role: 'student', gradeLevel: 9, reviewerStatus: 'pending', roleExpiresAt: null, createdAt: ago(41), lastActiveAt: ago(3), suspendedAt: null },
    { id: 'u_09', displayName: 'Colton Reyes', email: 'reyesco44@student.hse.k12.in.us', role: 'student', gradeLevel: 11, reviewerStatus: 'rejected', roleExpiresAt: null, createdAt: ago(150), lastActiveAt: ago(19), suspendedAt: null },
    { id: 'u_10', displayName: 'Harper Nguyen', email: 'nguyenha7@student.hse.k12.in.us', role: 'student', gradeLevel: 10, reviewerStatus: 'none', roleExpiresAt: null, createdAt: ago(88), lastActiveAt: ago(4), suspendedAt: null },
    { id: 'u_11', displayName: 'Isaiah Bell', email: 'bellis21@student.hse.k12.in.us', role: 'student', gradeLevel: 12, reviewerStatus: 'revoked', roleExpiresAt: null, createdAt: ago(370), lastActiveAt: ago(27), suspendedAt: null },
    { id: 'u_12', displayName: 'Nora Kaminski', email: 'kaminsno3@student.hse.k12.in.us', role: 'student', gradeLevel: 9, reviewerStatus: 'none', roleExpiresAt: null, createdAt: ago(30), lastActiveAt: ago(8), suspendedAt: null },
    { id: 'u_13', displayName: 'Tobias Adeyemi', email: 'adeyemto6@student.hse.k12.in.us', role: 'student', gradeLevel: 11, reviewerStatus: 'none', roleExpiresAt: null, createdAt: ago(55), lastActiveAt: ago(12), suspendedAt: null },
    { id: 'u_14', displayName: 'Mr. Daniel Okafor', email: 'dokafor@hse.k12.in.us', role: 'teacher_advisor', gradeLevel: null, reviewerStatus: 'approved', roleExpiresAt: null, isPrimaryAdvisor: false, createdAt: ago(180), lastActiveAt: ago(9), suspendedAt: null },
    { id: 'u_15', displayName: 'Ruby Santoro', email: 'santoror12@student.hse.k12.in.us', role: 'student', gradeLevel: 10, reviewerStatus: 'none', roleExpiresAt: null, createdAt: ago(210), lastActiveAt: ago(46), suspendedAt: ago(22), suspendReason: 'Repeated reported comments during the fall pilot. Suspended pending advisor conversation.' }
  ];

  WL.DEMO_ACCOUNT_IDS = ['u_student', 'u_reviewer', 'u_officer', 'u_teacher'];

  /* ---------------- Tag vocabulary ---------------- */

  WL.SEED_TAGS = [
    'AP Lang', 'AP Lit', 'Honors English 10', 'English 9', 'Common App',
    'Scholastic Entry', 'Rough Draft', 'Final Draft', 'Needs Structure Help',
    'Grammar Focus', 'Narrative Voice', 'Timed Write'
  ];

  /* ---------------- Works ---------------- */

  function W(o) { return o; }

  WL.SEED_WORKS = [
    W({
      id: 'w_01', authorUserId: 'u_10', title: 'The Quietest Room in the House',
      genre: 'Personal Essay', tags: ['AP Lang', 'Final Draft', 'Narrative Voice'],
      description: 'A piece about my grandmother’s sewing room and what it meant after she moved into assisted living.',
      feedbackFocus: 'Voice and style', status: 'approved',
      createdAt: ago(21), moderatedAt: ago(20, 18), moderatedBy: 'u_officer',
      originalFileName: 'quietest_room_FINAL_v3.docx', format: 'docx', fileSize: 41733,
      body: 'The sewing room was the only room in my grandmother’s house that did not apologize for itself.\n\nEverywhere else there were doilies, and the good china nobody ate off of, and the plastic runner in the hallway that made a sound like tearing paper when you walked on it. But the sewing room had a folding table, a lamp with a bent neck, and one window that faced the neighbor’s fence. It smelled like machine oil and the inside of a shoebox.\n\nShe let me sit under the table while she worked. From down there the world was a forest of thread ends and the two brown shoes she wore every day, and above me the machine went in bursts, five seconds, ten seconds, then quiet while she turned the fabric.\n\nWhen we moved her to Brookhaven in March, my mother asked what she wanted to take. She said the lamp. Not the machine, not the good china. The lamp with the bent neck that has never once been the most valuable thing in any room it has been in.\n\nIt is on her nightstand now. It does not match anything there either.'
    }),
    W({
      id: 'w_02', authorUserId: 'u_13', title: 'Why Our School Should Delay First Period',
      genre: 'Argumentative Essay', tags: ['AP Lang', 'Final Draft'],
      description: 'Argument for a 8:45 start time using sleep research. Not sure my counterargument section is strong enough.',
      feedbackFocus: 'Argument strength', status: 'approved',
      createdAt: ago(18), moderatedAt: ago(17, 20), moderatedBy: 'u_officer',
      originalFileName: 'start_time_argument.docx', format: 'docx', fileSize: 28104,
      body: 'At 6:10 in the morning, the average teenager in this district is doing something their own biology is actively arguing against.\n\nThe American Academy of Pediatrics has recommended since 2014 that middle and high schools begin no earlier than 8:30 a.m. The reasoning is not that students are lazy. During adolescence the circadian rhythm shifts later by roughly two hours, which means a sixteen-year-old told to sleep at nine is being told to sleep at what their body reads as seven.\n\nThe common objection is athletics. Practices, the argument goes, would be pushed into the dark. This is a real cost and I do not want to pretend otherwise. But districts that have made the change — Seattle in 2016 is the most studied — found that athletic participation held roughly steady while median sleep rose by thirty-four minutes and first-period grades rose measurably.\n\nThe second objection is buses, and this one is harder. A tiered bus schedule is genuinely expensive to rearrange. I would argue it is worth a one-year study rather than an immediate change, which is what I am actually asking the board to fund.'
    }),
    W({
      id: 'w_03', authorUserId: 'u_student', title: 'Nobody Warns You About the Drive Home',
      genre: 'Creative Nonfiction', tags: ['Narrative Voice', 'Rough Draft'],
      description: 'Something I have been working on outside of class. It is about my brother’s last cross country meet. I know the ending is not there yet.',
      feedbackFocus: 'Structure and organization', status: 'approved',
      createdAt: ago(12), moderatedAt: ago(11, 16), moderatedBy: 'u_teacher',
      originalFileName: 'drive home draft.docx', format: 'docx', fileSize: 22890,
      body: 'The thing about a cross country course is that you only see the runner three times. The start, the far turn by the retention pond, and whatever is left of them at the finish.\n\nMy brother came around the pond in fourth. My father said something under his breath that was either a prayer or a swear and is, in our family, frequently both.\n\nHe finished seventh. Seventh is a number that does not go on anything. It is not a medal, it is not a story, it is not even a bad enough result to be funny later.\n\nWe drove home the long way, past the Kroger and the church with the sign that always has a pun on it. Nobody said anything for eleven minutes. I counted, because counting was a thing to do.\n\nThen he said, from the back seat, "I wanted it to be over. That is the part I feel bad about. Not that I lost. That I wanted it to be over."\n\nI have been thinking about that sentence for four months. I still do not know how to end this.'
    }),
    W({
      id: 'w_04', authorUserId: 'u_06', title: 'Curley’s Wife Has No Name: Naming and Erasure in Of Mice and Men',
      genre: 'Literary Analysis', tags: ['Honors English 10', 'Final Draft'],
      description: 'Close reading focused on how Steinbeck withholds her name and what that does to the reader.',
      feedbackFocus: 'Evidence and citation', status: 'approved',
      createdAt: ago(15), moderatedAt: ago(14, 12), moderatedBy: 'u_officer',
      originalFileName: 'omam_analysis.docx', format: 'docx', fileSize: 34551,
      screeningNote: 'low',
      body: 'Steinbeck gives names to the dog, to the ranch hands, and to a man who appears in a single paragraph. He does not give one to Curley’s wife.\n\nThis is not carelessness. In the letter Steinbeck wrote to the actress Claire Luce, he explained that the character was never meant to be a person in her own right to the men who look at her, and the withheld name does that work on the page rather than in dialogue.\n\nWhen Candy calls her a tramp, and when George says "she’s gonna make a mess. They’s gonna be a bad mess about her," the reader is being handed the men’s assessment with nothing underneath it to check the assessment against. She has no name to be sorry for.\n\nThe one moment she is allowed interiority — the Riverside Dance Palace, the letter that never came — arrives so late that it functions as an accusation of the reader. We have spent the book taking the ranch’s word for her.'
    }),
    W({
      id: 'w_05', authorUserId: 'u_reviewer', title: 'Two Poems: Interstate 69, and After the Storm Sirens',
      genre: 'Poetry', tags: ['Scholastic Entry', 'Final Draft'],
      description: 'Two short poems I am submitting to Scholastic. Any reaction to the line breaks would help.',
      feedbackFocus: 'Voice and style', status: 'approved',
      createdAt: ago(9), moderatedAt: ago(8, 20), moderatedBy: 'u_officer',
      originalFileName: 'two_poems.docx', format: 'docx', fileSize: 18220,
      body: 'INTERSTATE 69\n\nMy mother learned this road\nthe year the mall was new,\nwhen every exit still promised\nsomething neither of us has seen.\n\nNow the billboards sell\nurgent care and a lawyer\nwith a shining, terrible face,\nand she drives it in her sleep,\n\nwhich is a way of saying\nshe drives it without me.\n\n\nAFTER THE STORM SIRENS\n\nWe stood in the garage doorway,\nwhich my father insisted\nwas the safest place, and was not.\n\nThe sky went the color\nof the inside of a peach.\nNothing came.\n\nFor an hour afterward\nthe neighborhood behaved\nlike people who had been spared,\nwhich is different\nfrom people who were never in danger,\nand better.'
    }),
    W({
      id: 'w_06', authorUserId: 'u_12', title: 'What the Lock-In Taught Me About Leadership',
      genre: 'College Application Essay', tags: ['Common App', 'Rough Draft', 'Needs Structure Help'],
      description: 'Common App personal statement draft. It is currently 780 words and needs to be 650.',
      feedbackFocus: 'Structure and organization', status: 'approved',
      createdAt: ago(7), moderatedAt: ago(6, 14), moderatedBy: 'u_officer',
      originalFileName: 'commonapp_draft2.docx', format: 'docx', fileSize: 25612,
      body: 'At 2:14 in the morning, in a gymnasium that smelled like floor wax and sixty-three sleeping bags, the sound system died.\n\nI was the sophomore in charge of the sound system. I would like to say I responded with calm authority. What I actually did was stand very still and consider, seriously, walking out the fire door.\n\nWhat happened instead is that a freshman named Ruben, who I had not spoken to once all year, said "is it the breaker?" It was the breaker.\n\nI have written four versions of this essay that end with a tidy sentence about how leadership is really about listening. Every one of them was a lie by omission, because the truer version is that I had spent the entire night believing I was the only person in the room who could fix anything, and I was wrong in a way that was, frankly, embarrassing before it was instructive.\n\n[Reviewer note from author: I know this is too long and the ending is soft. I am trying to figure out what to cut without losing the Ruben part.]'
    }),
    W({
      id: 'w_07', authorUserId: 'u_05', title: 'The Referendum Nobody Read: Inside the November School Funding Vote',
      genre: 'Journalism', tags: ['Final Draft'],
      description: 'Feature reporting piece for the school paper, expanded. Interviews with four board members.',
      feedbackFocus: 'Evidence and citation', status: 'approved',
      createdAt: ago(58), moderatedAt: ago(57, 2), moderatedBy: 'u_teacher',
      originalFileName: 'referendum_feature.docx', format: 'docx', fileSize: 51203,
      body: 'The ballot language ran to four hundred and six words. In a survey of one hundred and twelve district parents conducted outside three polling locations, eleven said they had read all of it.\n\nThis is not a story about whether the referendum was good policy. It is a story about the four hundred and six words.\n\n"We are legally required to use that phrasing," said board member Anne Ostrowski, who supported the measure. "I have argued for a plain-language summary on the same page. I have argued for it twice."\n\nThe measure passed by nine hundred and forty votes.'
    }),
    W({
      id: 'w_08', authorUserId: 'u_07', title: 'Mitochondrial Eve and the Limits of Popular Genetics',
      genre: 'Research Paper', tags: ['Honors English 10', 'Final Draft'],
      description: 'Research paper on how a technical term got mangled in popular science writing.',
      feedbackFocus: 'Grammar and mechanics', status: 'approved',
      createdAt: ago(70), moderatedAt: ago(69, 4), moderatedBy: 'u_officer',
      originalFileName: 'mito_eve_paper.docx', format: 'docx', fileSize: 62998,
      body: 'The phrase "Mitochondrial Eve" has done more damage to public understanding of human ancestry than almost any other three-syllable convenience in modern science writing.\n\nThe technical claim is narrow and unglamorous: every living human’s mitochondrial DNA traces back to a single female ancestor. The popular reading — that this woman was the first human, or the only woman alive, or in any sense biblical — is wrong in three separate directions at once.\n\nWhat makes the error durable is that the correction is harder to say than the mistake.'
    }),
    W({
      id: 'w_09', authorUserId: 'u_11', title: 'Speech: On Being the Kid Who Moved in October',
      genre: 'Speech / Oratory', tags: ['Narrative Voice', 'Final Draft'],
      description: 'Original oratory for speech team. Timed at 9:40.',
      feedbackFocus: 'General impressions', status: 'approved',
      createdAt: ago(110), moderatedAt: ago(109, 5), moderatedBy: 'u_officer',
      originalFileName: 'oratory_october.docx', format: 'docx', fileSize: 30117,
      body: 'There is no good month to move, but October is the worst one, and I can prove it.\n\nIn August, nobody has friends yet. In January, everyone is miserable enough to be kind. But in October, the seating charts have set. The group projects have already gone badly once. The inside jokes have a history.\n\nI have moved in October twice.'
    }),
    W({
      id: 'w_10', authorUserId: 'u_15', title: 'A Defense of the Five Paragraph Essay',
      genre: 'Argumentative Essay', tags: ['AP Lang', 'Timed Write'],
      description: 'Contrarian timed write. My teacher hated it, which I think means it worked.',
      feedbackFocus: 'Argument strength', status: 'approved',
      createdAt: ago(138), moderatedAt: ago(137, 4), moderatedBy: 'u_teacher',
      originalFileName: 'five_para_defense.docx', format: 'docx', fileSize: 19004,
      body: 'Everyone who has ever been taught the five paragraph essay has, at some later point, been told it is a crutch.\n\nThis is true. It is also true that a crutch is the correct technology for a broken leg, and that no one has ever recovered faster by being handed a bicycle instead.'
    }),
    W({
      id: 'w_11', authorUserId: 'u_13', title: 'The Last Bell',
      genre: 'Short Fiction', tags: ['AP Lit', 'Rough Draft'],
      description: 'A short story about the last day of school from the perspective of a kid who has decided not to come back. Content warning: there is a fight scene.',
      feedbackFocus: 'General impressions', status: 'flagged',
      createdAt: ago(1, 5), moderatedAt: null, moderatedBy: null,
      originalFileName: 'the_last_bell.docx', format: 'docx', fileSize: 44120,
      body: 'Marcus had decided on Tuesday, which meant by Friday the decision had had four days to grow teeth.\n\nHe watched Aiden Park across the cafeteria the way you watch weather. The same table, the same four people, the same laugh that arrived a half second before anything funny happened.\n\nIn the story Marcus had been telling himself, there was a knife. There was blood on the tile by the vending machines and a silence afterward so total that you could hear the compressor kick on. He had rehearsed it enough times that it had the texture of a memory instead of a plan.\n\nWhat actually happened is that Aiden dropped a tray, and half the cafeteria did the thing where everyone applauds, and Aiden did an exaggerated bow, and Marcus watched him bow and felt the story go out of him all at once, like air.\n\nHe went to fifth period. That is the whole ending. He went to fifth period, and he was there again on Monday, and nobody ever knew that a version of that room had existed where he did not.'
    }),
    W({
      id: 'w_12', authorUserId: 'u_08', title: 'Untitled (draft about my aunt)',
      genre: 'Personal Essay', tags: ['English 9', 'Rough Draft'],
      description: 'This is really rough. I mostly want to know if the middle section makes sense.',
      feedbackFocus: 'Structure and organization', status: 'pending',
      createdAt: ago(0, 9), moderatedAt: null, moderatedBy: null,
      originalFileName: 'aunt essay.docx', format: 'docx', fileSize: 15332,
      body: 'My aunt has a laugh that makes strangers turn around in restaurants, and for most of my childhood I was embarrassed by it, and now I am not, and the essay is supposed to be about the part in between.\n\nThe problem is that I do not remember the part in between. I remember being nine and sliding down in the booth. I remember being fifteen and telling a friend, unprompted, that my aunt was the funniest person I knew.\n\nSomewhere in those six years something turned over, and I did not notice it happening, and I am not sure an essay can be about a thing the writer did not witness.'
    }),
    W({
      id: 'w_13', authorUserId: 'u_09', title: 'Homecoming Court and Other Fictions',
      genre: 'Creative Nonfiction', tags: ['Rough Draft'],
      description: 'Satirical piece about homecoming. Names some staff, which I think is fine because it is affectionate.',
      feedbackFocus: 'General impressions', status: 'pending',
      createdAt: ago(2, 3), moderatedAt: null, moderatedBy: null,
      originalFileName: 'homecoming_satire.docx', format: 'docx', fileSize: 26440,
      body: 'The homecoming court is elected by a process that combines the worst features of a popularity contest and a municipal bond referendum.\n\nMr. Delgado runs the ballot count in the same room where he teaches third period government, which is either the most or the least appropriate venue possible, and he will not tell you the margins.\n\n"The margins," he said, when I asked him about the margins, "are not a matter of public record."\n\nI pointed out that he had, that morning, taught a unit on the Freedom of Information Act. He said that was different. I asked how. He said, "Because I said so, Colton," which is, in fairness, a legally recognized standard in exactly zero jurisdictions.'
    }),
    W({
      id: 'w_14', authorUserId: 'u_12', title: 'Photo Essay: Six Mornings on Cyntheanne Road',
      genre: 'Creative Nonfiction', tags: ['Rough Draft', 'Narrative Voice'],
      description: 'Photo essay — six images with short captions. The writing is mostly in the captions.',
      feedbackFocus: 'General impressions', status: 'pending',
      createdAt: ago(3, 1), moderatedAt: null, moderatedBy: null,
      originalFileName: 'six_mornings.pptx', format: 'pptx', fileSize: 4881200, hasEmbeddedImages: true,
      body: '[Slide 1] 6:04 a.m. The field before the subdivision went in. Caption: My mother calls this "the last corn," which is not accurate and has never been accurate.\n\n[Slide 2] 6:11 a.m. Frost on the Hendricks’ mailbox.\n\n[Slide 3] 6:20 a.m. The bus turning south, empty.\n\n[Slide 4] 6:31 a.m. Construction lights, the new roundabout.\n\n[Slide 5] 6:44 a.m. Same field, second week, staked.\n\n[Slide 6] 7:02 a.m. Nothing. I got there late and the light was ordinary. I am including it anyway.'
    }),
    W({
      id: 'w_15', authorUserId: 'u_10', title: 'Draft: Argument Against Class Rank',
      genre: 'Argumentative Essay', tags: ['AP Lang', 'Rough Draft'],
      description: 'Rough. Thesis is probably in the wrong paragraph.',
      feedbackFocus: 'Argument strength', status: 'changes_requested',
      createdAt: ago(5, 6), moderatedAt: ago(4, 2), moderatedBy: 'u_officer',
      denialReason: 'Strong piece, but paragraphs 3 and 4 quote a named classmate’s GPA and disciplinary record. Please remove the identifying details and resubmit — everything else can stay as written.',
      originalFileName: 'class_rank_argument.docx', format: 'docx', fileSize: 23881,
      body: 'Class rank is a number that pretends to be a fact.\n\nIt is computed to four decimal places from grades that were assigned by forty different people using forty different standards, and then it is reported to colleges as though it had been measured with an instrument.\n\n[Paragraphs 3–4 removed by the author pending revision.]'
    }),
    W({
      id: 'w_16', authorUserId: 'u_09', title: 'Why the Cafeteria Should Be Open Campus',
      genre: 'Argumentative Essay', tags: ['Rough Draft'],
      description: 'Open campus lunch argument.',
      feedbackFocus: 'Argument strength', status: 'denied',
      createdAt: ago(96), moderatedAt: ago(95, 6), moderatedBy: 'u_officer',
      denialReason: 'The central section is copied nearly verbatim from a published op-ed in the Indianapolis Star without attribution. The Writers Lab cannot host unattributed material. You are welcome to resubmit an original version, and Ms. Hartley is happy to talk through how to quote and cite a source properly.',
      originalFileName: 'open_campus.docx', format: 'docx', fileSize: 17008,
      body: '[This submission was denied and is not published. Administrators can still view the original file and the decision record.]'
    }),
    W({
      id: 'w_17', authorUserId: 'u_student', title: 'Six Weeks at the Animal Shelter',
      genre: 'Personal Essay', tags: ['Common App', 'Rough Draft'],
      description: 'First draft of a possible Common App essay. I withdrew it because I want to rewrite the opening completely.',
      feedbackFocus: 'General impressions', status: 'withdrawn',
      createdAt: ago(82), moderatedAt: ago(81, 3), moderatedBy: 'u_officer', withdrawnAt: ago(60),
      originalFileName: 'shelter_essay_v1.docx', format: 'docx', fileSize: 21440,
      body: 'I have started this essay with a dog four times. The dog is not the point and I keep letting her be the point.'
    }),
    W({
      id: 'w_18', authorUserId: 'u_05', title: 'The Bridge at Geist (short story)',
      genre: 'Short Fiction', tags: ['AP Lit', 'Final Draft', 'Scholastic Entry'],
      description: 'Short story, roughly 2,400 words. Third person, single day.',
      feedbackFocus: 'Structure and organization', status: 'approved',
      createdAt: ago(124), moderatedAt: ago(123, 8), moderatedBy: 'u_teacher',
      originalFileName: 'bridge_at_geist.docx', format: 'docx', fileSize: 58332,
      body: 'The bridge had a name on the county maps and a different one that everybody actually used, which is how you can tell a place has been lived in.\n\nEliza got there at four, which was early, and sat on the concrete lip with her heels knocking against it, and waited for a person who had said "probably" and meant "no."'
    }),
    W({
      id: 'w_19', authorUserId: 'u_06', title: 'Ode to the Second-String Goalkeeper',
      genre: 'Poetry', tags: ['Final Draft'],
      description: 'One poem, 22 lines.',
      feedbackFocus: 'Voice and style', status: 'approved',
      createdAt: ago(152), moderatedAt: ago(151, 6), moderatedBy: 'u_officer',
      originalFileName: 'ode_goalkeeper.docx', format: 'docx', fileSize: 14202,
      body: 'You are the reason the game has a shape.\nNot because you play\nbut because the field ends somewhere,\nand you have agreed to be the somewhere.\n\nYou warm up in the ninetieth minute\nof a match you will not enter,\nwhich is either devotion\nor a very specific kind of hope,\nand I have never been able to decide\nwhich one I would rather be accused of.'
    }),
    W({
      id: 'w_20', authorUserId: 'u_07', title: 'Timed Write: The Most Useful Thing I Have Been Wrong About',
      genre: 'Personal Essay', tags: ['Timed Write', 'Honors English 10'],
      description: 'Forty minute timed write, unedited. Posting it as-is on purpose.',
      feedbackFocus: 'General impressions', status: 'approved',
      createdAt: ago(11), moderatedAt: ago(10, 15), moderatedBy: 'u_officer',
      originalFileName: 'timed_write_wrong.docx', format: 'docx', fileSize: 12880,
      body: 'For most of middle school I believed that being quiet in a group was the same as being polite in a group.\n\nThese are not the same thing and the difference cost me two friendships, one of which I understood at the time and one of which I did not understand until this year, when the person in question was perfectly nice to me at a graduation party and I realized that perfectly nice was the whole distance.'
    })
  ];

  /* ---------------- Moderation flags ---------------- */

  WL.SEED_FLAGS = [
    {
      id: 'f_01', workId: 'w_11', category: 'Violence', severity: 'high', source: 'Automated content screening',
      matchedExcerpt: 'In the story Marcus had been telling himself, there was a knife. There was blood on the tile by the vending machines and a silence afterward so total that you could hear the compressor kick on.',
      matchedTerms: ['knife', 'blood'], createdAt: ago(1, 5), resolved: false
    },
    {
      id: 'f_02', workId: 'w_11', category: 'Self-harm / crisis language', severity: 'medium', source: 'Automated content screening',
      matchedExcerpt: 'a kid who has decided not to come back',
      matchedTerms: ['not to come back'], createdAt: ago(1, 5), resolved: false
    },
    {
      id: 'f_03', workId: 'w_13', category: 'Named staff member', severity: 'medium', source: 'School keyword list',
      matchedExcerpt: 'Mr. Delgado runs the ballot count in the same room where he teaches third period government, which is either the most or the least appropriate venue possible, and he will not tell you the margins.',
      matchedTerms: ['Delgado'], createdAt: ago(2, 3), resolved: false
    },
    {
      id: 'f_04', workId: 'w_14', category: 'Embedded images — human review required', severity: 'medium', source: 'File structure inspection',
      matchedExcerpt: 'File contains 6 embedded images in ppt/media/. Automated text screening cannot inspect image content.',
      matchedTerms: [], createdAt: ago(3, 1), resolved: false
    },
    {
      id: 'f_05', workId: 'w_04', category: 'Profanity (literary quotation)', severity: 'low', source: 'Automated content screening',
      matchedExcerpt: 'When Candy calls her a tramp, and when George says "she’s gonna make a mess. They’s gonna be a bad mess about her"',
      matchedTerms: ['tramp'], createdAt: ago(15), resolved: true,
      resolvedBy: 'u_officer', resolvedAt: ago(14, 12),
      resolveNote: 'Direct quotation from the assigned novel. Published normally; logging the flag only.'
    }
  ];

  /* ---------------- Comments ---------------- */

  WL.SEED_COMMENTS = [
    {
      id: 'c_01', workId: 'w_01', authorUserId: 'u_reviewer', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(19), editedAt: null, deletedAt: null,
      body: 'What is working: the lamp. You resist explaining it, and that restraint is the whole essay. When your grandmother says "the lamp" and you do not add a sentence telling us what it means, I believed her and I believed you.\n\nWhat is unclear: the second paragraph does a lot of scene-setting for a house we then leave. The plastic runner is a great detail but the doilies and the good china are doing the same job as each other.\n\nOne concrete suggestion: cut the good china, keep the runner, and give the space to the five-seconds-then-quiet rhythm of the machine. That is the sound of the essay and it only gets one sentence.'
    },
    {
      id: 'c_02', workId: 'w_01', authorUserId: 'u_officer', authorRoleAtTime: 'officer_admin',
      parentCommentId: null, createdAt: ago(18, 4), editedAt: null, deletedAt: null,
      body: 'Agreeing with Devon on the ending. I want to add one thing about the last line — "It does not match anything there either" is doing something sneaky and good, because "either" is the only word in the essay that admits the sewing room did not match the house. You have been withholding that judgment for four hundred words and then you hand it over in one syllable. Do not let a workshop talk you out of it.'
    },
    {
      id: 'c_03', workId: 'w_01', authorUserId: 'u_10', authorRoleAtTime: 'student',
      parentCommentId: 'c_01', createdAt: ago(17), editedAt: null, deletedAt: null,
      body: 'Thank you — this is the first time anyone has told me which details to cut instead of just saying "add more detail." Cutting the china.'
    },
    {
      id: 'c_04', workId: 'w_02', authorUserId: 'u_05', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(16), editedAt: ago(15, 20), deletedAt: null,
      body: 'The counterargument section is stronger than you think, but it is in the wrong order. Right now you take the easy objection (athletics) first and the hard one (buses) second, and you concede the hard one. That means your essay ends on your weakest ground.\n\nFlip them. Deal with buses first, concede what you have to concede, then close on Seattle where you have actual numbers. Same content, and the reader leaves holding your evidence instead of your concession.'
    },
    {
      id: 'c_05', workId: 'w_02', authorUserId: 'u_reviewer', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(14), editedAt: null, deletedAt: null,
      body: 'Small mechanical thing: you write "the American Academy of Pediatrics has recommended since 2014" and then never cite the statement itself. For a school board audience that is the one citation they will actually check. Put it in a footnote.'
    },
    {
      id: 'c_06', workId: 'w_03', authorUserId: 'u_06', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(10), editedAt: null, deletedAt: null,
      body: 'You already have your ending and you put it in the middle. "I wanted it to be over. That is the part I feel bad about."\n\nEverything after that line is you apologizing for not knowing how to end it. Delete the apology. End on the four months.'
    },
    {
      id: 'c_07', workId: 'w_03', authorUserId: 'u_student', authorRoleAtTime: 'student',
      parentCommentId: 'c_06', createdAt: ago(9, 12), editedAt: null, deletedAt: null,
      body: 'Oh. Yes. I think I kept the last paragraph because writing it down was how I figured out I was stuck, and then I never took the scaffolding off. Thank you.'
    },
    {
      id: 'c_08', workId: 'w_04', authorUserId: 'u_officer', authorRoleAtTime: 'officer_admin',
      parentCommentId: null, createdAt: ago(13), editedAt: null, deletedAt: null,
      body: 'The Claire Luce letter is a real find and it is doing heavy lifting, so it needs a real citation — right now a reader has to take your word for both the letter and its contents. Steinbeck: A Life in Letters has it, and your teacher will want the page.\n\nThe last paragraph is the best paragraph. "It functions as an accusation of the reader" is the thesis. Consider whether it should be the first sentence instead of the last.'
    },
    {
      id: 'c_09', workId: 'w_05', authorUserId: 'u_05', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(7), editedAt: null, deletedAt: null,
      body: 'On the line breaks in Interstate 69: the break after "something neither of us has seen" is the only one that surprised me, and it is the best one in the poem. Most of the others land exactly where the grammar would have paused anyway, which makes them invisible.\n\nSecond poem — "which is different / from people who were never in danger, / and better" is doing the whole job. I would not touch it.'
    },
    {
      id: 'c_10', workId: 'w_06', authorUserId: 'u_reviewer', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(5), editedAt: null, deletedAt: null,
      body: 'You asked what to cut to get to 650. Cut the four-versions paragraph. I know it is the one you like. It is also the only paragraph where you talk about the essay instead of writing it, and admissions readers have seen that move a thousand times.\n\nKeep Ruben. Keep "is it the breaker?" Keep the fire door, which is the most honest sentence in the draft.'
    },
    {
      id: 'c_11', workId: 'w_06', authorUserId: 'u_15', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(4, 8), editedAt: null, deletedAt: ago(3, 2), deletedBy: 'u_officer',
      deleteReason: 'Personal remark about the author rather than feedback on the writing. Reviewer status revoked and account suspended pending a conversation with the advisor.',
      body: '[removed]'
    },
    {
      id: 'c_12', workId: 'w_07', authorUserId: 'u_teacher', authorRoleAtTime: 'teacher_advisor',
      parentCommentId: null, createdAt: ago(55), editedAt: null, deletedAt: null,
      body: 'This is the strongest piece of student reporting I have read here. Two notes.\n\nFirst, the survey: one hundred and twelve parents outside three polling locations is a real number, and you should say how you selected them, because the first thing a skeptical reader will ask is whether you stood outside the precinct most likely to agree with you.\n\nSecond, Ostrowski gets the only quote. Find one board member who opposed the measure and give them the same courtesy, even if their answer is worse for your piece. Especially then.'
    },
    {
      id: 'c_13', workId: 'w_18', authorUserId: 'u_06', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(118), editedAt: null, deletedAt: null,
      body: 'The opening two sentences promise a story about a place and the rest of it is a story about waiting. Both are good. They are not yet the same story.\n\nOne concrete suggestion: bring the bridge back in the last scene. You never physically return to it after the first paragraph and the title is making a promise the ending does not keep.'
    },
    {
      id: 'c_14', workId: 'w_20', authorUserId: 'u_reviewer', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(9, 4), editedAt: null, deletedAt: null,
      body: '"Perfectly nice was the whole distance" is a finished sentence in an unfinished essay, which is a good problem. For a forty minute timed write this is genuinely impressive control.'
    },
    {
      id: 'c_15', workId: 'w_02', authorUserId: 'u_15', authorRoleAtTime: 'reviewer',
      parentCommentId: null, createdAt: ago(3, 4), editedAt: null, deletedAt: null,
      body: 'this is good!'
    }
  ];

  /* ---------------- Comment reports ---------------- */

  WL.SEED_COMMENT_REPORTS = [
    {
      id: 'cr_01', commentId: 'c_15', reporterUserId: 'u_13',
      reason: 'This is not feedback. It is a two-word comment on a nine-hundred word essay and it counts toward the reviewer’s activity total, which makes the coverage numbers look better than they are.',
      status: 'open', createdAt: ago(2, 6), resolvedBy: null, resolvedAt: null
    },
    {
      id: 'cr_02', commentId: 'c_11', reporterUserId: 'u_12',
      reason: 'The comment is about me and not about my essay. I do not want it on my page.',
      status: 'resolved', createdAt: ago(4), resolvedBy: 'u_officer', resolvedAt: ago(3, 2),
      resolution: 'Comment deleted, reviewer status revoked, account suspended pending advisor conversation. Author notified.'
    }
  ];

  /* ---------------- Reviewer applications ---------------- */

  WL.SEED_APPLICATIONS = [
    {
      id: 'ra_01', userId: 'u_07', status: 'pending', createdAt: ago(4, 2),
      gradeLevel: 10, englishCourse: 'Honors English 10 — Ms. Hartley',
      teacherReference: 'Ms. Hartley',
      statement: 'I have been reading other people’s drafts since sixth grade, mostly because my older sister made me. What I have learned from that is that most of the time the writer already knows what is wrong and needs someone to say it out loud so they are allowed to fix it.\n\nI would want to focus on research papers and analysis, because that is what I read most and I think I would be more useful there than on poetry, where I would mostly just say I liked it.'
    },
    {
      id: 'ra_02', userId: 'u_08', status: 'pending', createdAt: ago(1, 8),
      gradeLevel: 9, englishCourse: 'English 9 — Mr. Okafor',
      teacherReference: 'Mr. Okafor',
      statement: 'I know I am a freshman and that is probably the main argument against me. What I would say is that I have had my own work reviewed here twice and both times the comment that helped most was from someone who noticed something small, and I think noticing small things is a skill I actually have.\n\nI would be fine starting on the probationary period where an officer reads my comments first. I would rather do that than not do it.'
    },
    {
      id: 'ra_03', userId: 'u_06', status: 'approved', createdAt: ago(190), decidedAt: ago(186),
      decidedBy: 'u_teacher', gradeLevel: 11, englishCourse: 'Honors English 10',
      statement: 'I want to review because I have gotten better at my own writing mainly by reading other people’s and figuring out why something did not land.',
      decisionReason: 'Approved. Strong sample feedback in the trial round.'
    },
    {
      id: 'ra_04', userId: 'u_09', status: 'rejected', createdAt: ago(60), decidedAt: ago(56),
      decidedBy: 'u_officer', gradeLevel: 11, englishCourse: 'AP Lang',
      statement: 'I would like to be a reviewer because it would look good for NHS hours and I am a strong writer.',
      decisionReason: 'Not approved for this term. The application does not describe how you would give feedback to another writer, which is the main thing we are evaluating. You are welcome to reapply next semester — Ms. Hartley is glad to look at a draft of a stronger application with you first.',
      mayReapply: true
    }
  ];

  /* ---------------- Audit log ---------------- */

  WL.SEED_AUDIT = [
    { id: 'a_01', actorUserId: 'u_officer', action: 'work.approve', targetType: 'work', targetId: 'w_01', reason: null, createdAt: ago(20, 18) },
    { id: 'a_02', actorUserId: 'u_officer', action: 'work.approve', targetType: 'work', targetId: 'w_02', reason: null, createdAt: ago(17, 20) },
    { id: 'a_03', actorUserId: 'u_officer', action: 'flag.clear', targetType: 'work', targetId: 'w_04', reason: 'Direct quotation from the assigned novel. Published normally; logging the flag only.', createdAt: ago(14, 12) },
    { id: 'a_04', actorUserId: 'u_teacher', action: 'work.approve', targetType: 'work', targetId: 'w_03', reason: null, createdAt: ago(11, 16) },
    { id: 'a_05', actorUserId: 'u_officer', action: 'work.deny', targetType: 'work', targetId: 'w_16', reason: 'Unattributed material copied from a published op-ed.', createdAt: ago(95, 6) },
    { id: 'a_06', actorUserId: 'u_officer', action: 'work.request_changes', targetType: 'work', targetId: 'w_15', reason: 'Identifying details about a named classmate in paragraphs 3 and 4.', createdAt: ago(4, 2) },
    { id: 'a_07', actorUserId: 'u_officer', action: 'comment.delete', targetType: 'comment', targetId: 'c_11', reason: 'Personal remark about the author rather than feedback on the writing.', createdAt: ago(3, 2) },
    { id: 'a_08', actorUserId: 'u_officer', action: 'reviewer.revoke', targetType: 'user', targetId: 'u_15', reason: 'Reported comment upheld. Reviewer status revoked.', createdAt: ago(3, 2) },
    { id: 'a_09', actorUserId: 'u_officer', action: 'account.suspend', targetType: 'user', targetId: 'u_15', reason: 'Suspended pending a conversation with the advisor.', createdAt: ago(22) },
    { id: 'a_10', actorUserId: 'u_teacher', action: 'application.approve', targetType: 'user', targetId: 'u_06', reason: 'Strong sample feedback in the trial round.', createdAt: ago(186) },
    { id: 'a_11', actorUserId: 'u_officer', action: 'application.reject', targetType: 'user', targetId: 'u_09', reason: 'Application does not describe a feedback approach. May reapply.', createdAt: ago(56) },
    { id: 'a_12', actorUserId: 'u_teacher', action: 'admin.grant', targetType: 'user', targetId: 'u_officer', reason: 'Elected NEHS officer for the current school year.', createdAt: ago(210) },
    { id: 'a_13', actorUserId: 'u_teacher', action: 'settings.change', targetType: 'setting', targetId: 'officersCanSeeAuthors', reason: 'Set to OFF at the request of the pilot group. Officers moderate without author names.', createdAt: ago(180) },
    { id: 'a_14', actorUserId: 'u_teacher', action: 'work.approve', targetType: 'work', targetId: 'w_07', reason: null, createdAt: ago(57, 2) },
    { id: 'a_15', actorUserId: 'u_officer', action: 'work.approve', targetType: 'work', targetId: 'w_20', reason: null, createdAt: ago(10, 15) }
  ];

  /* ---------------- Notifications ---------------- */

  WL.SEED_NOTIFICATIONS = [
    { id: 'n_01', userId: 'u_student', type: 'comment.new', createdAt: ago(9, 12), readAt: null, title: 'New feedback on "Nobody Warns You About the Drive Home"', body: 'A peer reviewer left a comment on your submission.', link: '#/work/w_03' },
    { id: 'n_02', userId: 'u_student', type: 'work.approved', createdAt: ago(11, 16), readAt: ago(11), title: 'Your submission was approved', body: '"Nobody Warns You About the Drive Home" is now visible to other users.', link: '#/work/w_03' },
    { id: 'n_03', userId: 'u_student', type: 'work.withdrawn', createdAt: ago(16), readAt: ago(16), title: 'Submission withdrawn', body: 'You withdrew "Six Weeks at the Animal Shelter". It is no longer visible to other users.', link: '#/mywork' },

    { id: 'n_04', userId: 'u_reviewer', type: 'queue.needs_review', createdAt: ago(1, 2), readAt: null, title: '3 approved works have no feedback yet', body: 'The oldest has been waiting 7 days. Open the needs-review queue.', link: '#/needs-review' },
    { id: 'n_05', userId: 'u_reviewer', type: 'work.approved', createdAt: ago(8, 20), readAt: ago(8), title: 'Your submission was approved', body: '"Two Poems: Interstate 69, and After the Storm Sirens" is now visible to other users.', link: '#/work/w_05' },

    { id: 'n_06', userId: 'u_officer', type: 'flag.high', createdAt: ago(1, 5), readAt: null, title: 'High-severity flag raised', body: '"The Last Bell" was flagged for violence and held from publication. Priority queue.', link: '#/queue' },
    { id: 'n_07', userId: 'u_officer', type: 'application.new', createdAt: ago(1, 8), readAt: null, title: 'New reviewer application', body: 'A 9th grade student applied to be a peer reviewer.', link: '#/applications' },
    { id: 'n_08', userId: 'u_officer', type: 'comment.reported', createdAt: ago(2, 6), readAt: null, title: 'A comment was reported', body: 'Reason given: the comment is not substantive feedback.', link: '#/reports' },
    { id: 'n_09', userId: 'u_officer', type: 'work.new', createdAt: ago(0, 9), readAt: null, title: 'New submission awaiting review', body: '"Untitled (draft about my aunt)" entered the queue.', link: '#/queue' },

    { id: 'n_10', userId: 'u_teacher', type: 'flag.high', createdAt: ago(1, 5), readAt: null, title: 'High-severity flag raised', body: '"The Last Bell" was flagged for violence and held from publication.', link: '#/queue' },
    { id: 'n_11', userId: 'u_teacher', type: 'role.expiring', createdAt: ago(0, 4), readAt: null, title: '2 elevated roles expire at the end of this school year', body: 'Officer administrator and peer reviewer roles need to be re-confirmed or allowed to lapse.', link: '#/accounts' },
    { id: 'n_12', userId: 'u_teacher', type: 'application.new', createdAt: ago(1, 8), readAt: ago(1), title: 'New reviewer application', body: 'A 9th grade student applied to be a peer reviewer.', link: '#/applications' }
  ];

  /* ---------------- Reviewer claims ---------------- */

  WL.SEED_CLAIMS = [
    { id: 'cl_01', workId: 'w_18', userId: 'u_05', createdAt: ago(0, 3), expiresAt: new Date(T0 + 45 * 3600000).toISOString() }
  ];

  /* ---------------- Site settings ---------------- */

  WL.SEED_SETTINGS = {
    officersCanSeeAuthors: false,
    probationaryComments: true,
    probationCommentCount: 3,
    minCommentLength: 140,
    showFeedbackScaffold: true,
    maxFileSizeMB: 25,
    convertToPdf: true,
    stripMetadata: true,
    malwareScan: true,
    autoScreening: true,
    requireConsent: true,
    roleExpiryEnabled: true,
    roleExpiresOn: endOfSchoolYear(),
    notifyAdminNewSubmission: true,
    notifyAdminNewApplication: true,
    notifyAdminHighSeverity: true,
    notifyAdminCommentReported: true,
    notifyAdminWeeklyDigest: false
  };

  WL.SEED_KEYWORDS = ['Delgado', 'Ostrowski', 'Brookhaven'];

  WL.ago = ago;
  WL.ahead = ahead;
  WL.endOfSchoolYear = endOfSchoolYear;
})(window.WL);
