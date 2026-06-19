# Push this to https://github.com/XstocksSurpport/XstocksSurpport.github.io
# Fixes GitHub www check (NotServedByPagesError) when using www CNAME -> github.io

cd github-user-site
git init
git add index.html
git commit -m "Redirect xstockssurpport.github.io to null.baby"
git branch -M main
git remote add origin https://github.com/XstocksSurpport/XstocksSurpport.github.io.git
git push -u origin main
