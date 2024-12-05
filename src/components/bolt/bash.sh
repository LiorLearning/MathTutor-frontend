grep -rl "import.*'~/" . | while read -r file; do
  sed -i "s|'~|'@/components/bolt/|g" "$file"
done