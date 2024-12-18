<script>
	let {count = $bindable()} = $props();
</script>

<button onclick={()=>{count += 1}}>Go up</button>