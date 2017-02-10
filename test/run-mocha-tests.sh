 #!/bin/bash
 export ISTANBUL_REPORTERS=text
 mocha --inline-diffs --check-leaks --ui tdd --reporter mocha-istanbul --slow 200 --timeout 5000 --recursive istanbul --compilers js:babel-core/register