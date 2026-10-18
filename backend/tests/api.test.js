const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let server;
let baseUrl;

// Helper to make HTTP requests against test server
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await pool.end();
});

test('GET /api/health should return system status', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'healthy');
  assert.equal(res.body.database, 'MySQL 8.0 (InnoDB)');
});

test('Publisher CRUD and constraints', async (t) => {
  // 1. Create publisher
  const uniqueName = `Test Publisher ${Date.now()}`;
  const createRes = await request('POST', '/api/publishers', { PublisherName: uniqueName });
  assert.equal(createRes.status, 201);
  const publisherId = createRes.body.data.PublisherID;

  // 2. Reject duplicate publisher name
  const dupRes = await request('POST', '/api/publishers', { PublisherName: uniqueName });
  assert.equal(dupRes.status, 409);

  // 3. Update publisher
  const updateRes = await request('PUT', `/api/publishers/${publisherId}`, { PublisherName: `${uniqueName} Updated` });
  assert.equal(updateRes.status, 200);

  // 4. Delete publisher
  const delRes = await request('DELETE', `/api/publishers/${publisherId}`);
  assert.equal(delRes.status, 200);
});

test('Books CRUD and inventory constraints', async (t) => {
  const testIsbn = `TEST-${Date.now()}`;
  
  // 1. Create a valid book
  const createRes = await request('POST', '/api/books', {
    ISBN: testIsbn,
    Title: 'Test Database Fundamentals',
    AuthorName: 'Dr. Relational',
    PublisherID: 1,
    Price: 499.00,
    NoOfPages: 350,
    Edition: '1st Edition',
    TotalCopies: 3
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.data.AvailableCopies, 3);

  // 2. Reject duplicate ISBN
  const dupRes = await request('POST', '/api/books', {
    ISBN: testIsbn,
    Title: 'Duplicate Book',
    AuthorName: 'Another Author',
    PublisherID: 1,
    Price: 200,
    TotalCopies: 1
  });
  assert.equal(dupRes.status, 409);

  // 3. Reject invalid price (< 0)
  const invalidPriceRes = await request('POST', '/api/books', {
    ISBN: `NEG-${Date.now()}`,
    Title: 'Negative Price Book',
    AuthorName: 'Author',
    PublisherID: 1,
    Price: -50,
    TotalCopies: 1
  });
  assert.equal(invalidPriceRes.status, 400);

  // 4. Clean up test book
  const delRes = await request('DELETE', `/api/books/${testIsbn}`);
  assert.equal(delRes.status, 200);
});

test('Member registration and borrowing workflow', async (t) => {
  // 1. Register a new active member
  const email = `patron.${Date.now()}@ccet.edu.in`;
  const regRes = await request('POST', '/api/members', {
    Name: 'Test Patron',
    Email: email,
    ContactNo: '+91 99999 88888',
    MembershipStatus: 'Active',
    Address: 'Campus Hostel'
  });
  assert.equal(regRes.status, 201);
  const memberId = regRes.body.data.MemberID;

  // 2. Issue a book to this member (ISBN: 978-0131103627)
  const issueRes = await request('POST', '/api/issues', {
    MemberID: memberId,
    ISBN: '978-0131103627',
    StaffID: 1
  });
  assert.equal(issueRes.status, 201);
  const issueId = issueRes.body.data.IssueID;
  assert.ok(issueId);

  // 3. Return the book
  const returnRes = await request('POST', `/api/issues/${issueId}/return`, {
    StaffID: 2
  });
  assert.equal(returnRes.status, 200);
  assert.equal(returnRes.body.data.IssueID, issueId);

  // 4. Reject duplicate return
  const dupReturnRes = await request('POST', `/api/issues/${issueId}/return`, {
    StaffID: 2
  });
  assert.equal(dupReturnRes.status, 400);

  // 5. Suspend member and verify issue is rejected
  await request('PATCH', `/api/members/${memberId}/status`, { status: 'Suspended' });
  const suspendedIssueRes = await request('POST', '/api/issues', {
    MemberID: memberId,
    ISBN: '978-0131103627',
    StaffID: 1
  });
  assert.equal(suspendedIssueRes.status, 400);
  assert.match(suspendedIssueRes.body.message, /Suspended/);
});

test('Borrowing limits and copy exhaustion enforcement', async (t) => {
  // Book 978-0071807999 has TotalCopies=1 and AvailableCopies=0 (exhausted by seed data)
  const exhaustedRes = await request('POST', '/api/issues', {
    MemberID: 17, // Active member
    ISBN: '978-0071807999',
    StaffID: 1
  });
  assert.equal(exhaustedRes.status, 400);
  assert.match(exhaustedRes.body.message, /No copies.*available/i);
});

test('Fine Payment recording and overpayment rejection', async (t) => {
  // In seed data: IssueID 3 has FineAmount = 50.00, FinePaidAmount = 30.00 (Outstanding = 20.00)
  // 1. Attempt overpayment (₹25 > ₹20 balance)
  const overpayRes = await request('POST', '/api/payments/fines', {
    IssueID: 3,
    MemberID: 3,
    StaffID: 2,
    Amount: 25.00,
    PaymentMethod: 'UPI'
  });
  assert.equal(overpayRes.status, 400);
  assert.match(overpayRes.body.message, /exceeds outstanding balance/i);

  // 2. Valid partial/full payment (₹10 <= ₹20)
  const validPayRes = await request('POST', '/api/payments/fines', {
    IssueID: 3,
    MemberID: 3,
    StaffID: 2,
    Amount: 10.00,
    PaymentMethod: 'UPI'
  });
  assert.equal(validPayRes.status, 201);
  assert.equal(validPayRes.body.data.RemainingBalance, 10.00);
});

test('Database Explorer Predefined Queries', async () => {
  // 1. Retrieve query catalog
  const queriesRes = await request('GET', '/api/explorer/queries');
  assert.equal(queriesRes.status, 200);
  assert.ok(queriesRes.body.data.length >= 15);

  // 2. Execute a predefined query (e.g. query-1)
  const runRes = await request('POST', '/api/explorer/run-query', { queryId: 'query-1' });
  assert.equal(runRes.status, 200);
  assert.ok(runRes.body.rowCount > 0);
  assert.ok(Array.isArray(runRes.body.data));
  assert.ok(runRes.body.executionTimeMs);
});

test('Reports and Dashboard API endpoints', async () => {
  const dashRes = await request('GET', '/api/dashboard/stats');
  assert.equal(dashRes.status, 200);
  assert.ok(dashRes.body.data.summary.totalTitles > 0);
  assert.ok(dashRes.body.data.popularBooks.length > 0);

  const invRes = await request('GET', '/api/reports/inventory');
  assert.equal(invRes.status, 200);
  assert.ok(invRes.body.data.length > 0);

  const overdueRes = await request('GET', '/api/reports/overdue');
  assert.equal(overdueRes.status, 200);
  assert.ok(overdueRes.body.data.length > 0);
});
