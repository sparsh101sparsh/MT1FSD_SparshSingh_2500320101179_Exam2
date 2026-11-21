// Automated Test Suite for Library Book Management API (SET A)
// Student: Sparsh Singh (2500320101179)

const http = require('http');
const app = require('./server');

const TEST_PORT = 3001;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(TEST_PORT, async () => {
    console.log(`Test server running on port ${TEST_PORT}\n`);

    let passed = 0;
    let failed = 0;

    function assert(testName, condition, details = '') {
      if (condition) {
        console.log(`PASS: ${testName}`);
        passed++;
      } else {
        console.error(`FAIL: ${testName} - ${details}`);
        failed++;
      }
    }

    try {
      // 1. Root info check
      const rootRes = await request('GET', '/');
      assert('GET / returns 200 with student details', rootRes.status === 200 && rootRes.body.rollNumber === '2500320101179');

      // 2. GET all books
      const getAllRes = await request('GET', '/api/books');
      assert('GET /api/books returns 200 with array', getAllRes.status === 200 && Array.isArray(getAllRes.body) && getAllRes.body.length === 3);

      // 3. POST new record (valid data from exam sheet)
      const newBookPayload = {
        title: 'The Discovery of India',
        author: 'Jawaharlal Nehru',
        genre: 'History',
        publishedYear: 1946,
        available: true
      };
      const postRes = await request('POST', '/api/books', newBookPayload);
      assert('POST /api/books returns 201 with created record', postRes.status === 201 && postRes.body.id === 104 && postRes.body.title === 'The Discovery of India');

      // 4. POST with invalid data (missing author and invalid type)
      const invalidPost = await request('POST', '/api/books', { title: 'Broken Book' });
      assert('POST /api/books returns 400 on invalid input', invalidPost.status === 400);

      // 5. GET record by valid ID
      const getByIdRes = await request('GET', '/api/books/101');
      assert('GET /api/books/101 returns 200 with Wings of Fire', getByIdRes.status === 200 && getByIdRes.body.title === 'Wings of Fire');

      // 6. GET record by non-existent ID
      const getMissingRes = await request('GET', '/api/books/999');
      assert('GET /api/books/999 returns 404', getMissingRes.status === 404);

      // 7. Filter records by author (case-insensitive, e.g. 'kalam')
      const filterRes = await request('GET', '/api/books/filter?author=kalam');
      assert('GET /api/books/filter?author=kalam returns 200 and matches A.P.J. Abdul Kalam', filterRes.status === 200 && filterRes.body.length === 1 && filterRes.body[0].id === 101);

      // 8. Filter records with no match (must return empty array with 200)
      const filterEmptyRes = await request('GET', '/api/books/filter?author=Shakespeare');
      assert('GET /api/books/filter?author=Shakespeare returns 200 with empty array', filterEmptyRes.status === 200 && Array.isArray(filterEmptyRes.body) && filterEmptyRes.body.length === 0);

      // 9. Filter route without author parameter returns 400
      const filterMissingParam = await request('GET', '/api/books/filter');
      assert('GET /api/books/filter without query param returns 400', filterMissingParam.status === 400);

      // 10. PUT update record (example from exam sheet)
      const updatePayload = {
        title: 'The Alchemist - Revised Edition',
        author: 'Paulo Coelho',
        genre: 'Fiction',
        publishedYear: 1988,
        available: true
      };
      const putRes = await request('PUT', '/api/books/102', updatePayload);
      assert('PUT /api/books/102 returns 200 with updated record', putRes.status === 200 && putRes.body.title === 'The Alchemist - Revised Edition');

      // 11. PUT with non-existent ID returns 404
      const putMissing = await request('PUT', '/api/books/999', updatePayload);
      assert('PUT /api/books/999 returns 404', putMissing.status === 404);

      // 12. DELETE record by ID
      const deleteRes = await request('DELETE', '/api/books/103');
      assert('DELETE /api/books/103 returns 200 with success message', deleteRes.status === 200 && deleteRes.body.message.includes('deleted successfully'));

      // 13. Verify deleted record is no longer found
      const getDeletedRes = await request('GET', '/api/books/103');
      assert('GET /api/books/103 after deletion returns 404', getDeletedRes.status === 404);

      // 14. DELETE non-existent ID returns 404
      const deleteMissing = await request('DELETE', '/api/books/999');
      assert('DELETE /api/books/999 returns 404', deleteMissing.status === 404);

    } catch (err) {
      console.error('Test execution error:', err);
      failed++;
    } finally {
      console.log(`\nTests finished: ${passed} passed, ${failed} failed`);
      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    }
  });
}

runTests();
