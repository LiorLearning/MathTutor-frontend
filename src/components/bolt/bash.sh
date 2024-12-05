grep -rl "import.*'@/components/bolt/" . | while read -r file; do
  # Use sed with an empty backup extension for macOS compatibility
  sed -i'' -e 's|@/components/bolt/|@/components/bolt/|g' "$file"
done