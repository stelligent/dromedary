@test "nginx service running" {
  run service nginx status
  [ "$status" -eq 0 ]
}
